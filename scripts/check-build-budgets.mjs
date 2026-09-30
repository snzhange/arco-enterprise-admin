import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const mode = process.argv.find(argument => argument.startsWith('--mode='))?.slice('--mode='.length) || 'fail'
const budgetsPath = path.resolve(projectRoot, 'config/build-budgets.json')
const budgetsConfig = JSON.parse(await readFile(budgetsPath, 'utf8'))
const reportPath = path.resolve(projectRoot, 'dist/build-assets-report.json')
const report = JSON.parse(await readFile(reportPath, 'utf8'))
const baselinePath = path.resolve(projectRoot, budgetsConfig.baseline)
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
const budgets = budgetsConfig.budgets
const metrics = report.metrics
const sourceMetrics = report.sourceMetrics

const checks = [
  ['入口 gzip', metrics.entryGzipBytes, budgets.entryGzipBytes],
  ['JavaScript 单文件 gzip', metrics.maxJavaScriptGzipBytes, budgets.maxJavaScriptGzipBytes],
  ['CSS 单文件 gzip', metrics.maxCssGzipBytes, budgets.maxCssGzipBytes],
  ['媒体单文件原始大小', metrics.maxMediaBytes, budgets.maxMediaBytes],
  ['媒体单文件 gzip', metrics.maxMediaGzipBytes, budgets.maxMediaGzipBytes],
  ['媒体总原始大小', metrics.mediaBytes, budgets.maxTotalMediaBytes],
  ['源媒体单文件原始大小', sourceMetrics.maxMediaBytes, budgets.maxSourceMediaBytes],
  ['源媒体单文件 gzip', sourceMetrics.maxMediaGzipBytes, budgets.maxSourceMediaGzipBytes],
]
const violations = checks.filter(([, current, budget]) => current > budget)

function formatBytes(value) {
  return `${(value / 1024).toFixed(1)} KiB`
}

console.log(`资源预算模式：${mode}`)
for (const [name, current, budget] of checks)
  console.log(`${name}: 当前 ${formatBytes(current)} / 预算 ${formatBytes(budget)}${current > budget ? ' 超限' : ''}`)

if (violations.length) {
  console.error('超限资源明细：')
  for (const [name, current, budget] of violations) {
    const resourceType = name.includes('入口')
      ? 'entry'
      : name.includes('JavaScript')
        ? 'javascript'
        : name.includes('CSS')
          ? 'css'
          : name.includes('媒体') ? 'media' : undefined
    const source = name.startsWith('源媒体') ? report.sourceFiles : report.files
    const candidates = resourceType === 'entry'
      ? report.files.filter(file => file.entry)
      : resourceType ? source.filter(file => file.type === resourceType) : []
    const key = name.includes('原始') ? 'bytes' : 'gzipBytes'
    const largest = resourceType === 'entry'
      ? candidates.sort((left, right) => right[key] - left[key])
      : candidates.filter(file => file[key] > budget).sort((left, right) => right[key] - left[key])
    for (const file of largest)
      console.error(`- ${file.path}: 原始 ${formatBytes(file.bytes)}，gzip ${formatBytes(file.gzipBytes)}，预算 ${formatBytes(budget)}`)
    if (!largest.length)
      console.error(`- ${name}: 当前 ${formatBytes(current)}，预算 ${formatBytes(budget)}`)
  }
}

const baselineMetrics = baseline.metrics || {}
for (const key of ['entryGzipBytes', 'javascriptGzipBytes', 'cssGzipBytes', 'mediaBytes', 'mediaGzipBytes']) {
  const current = metrics[key]
  const previous = baselineMetrics[key]
  if (typeof previous !== 'number' || previous === 0)
    continue
  const delta = current - previous
  const percent = (delta / previous * 100).toFixed(1)
  console.log(`基线差异 ${key}: ${delta >= 0 ? '+' : ''}${formatBytes(delta)} (${delta >= 0 ? '+' : ''}${percent}%)`)
}

if (violations.length) {
  console.error(`资源预算超限：${violations.length} 项`)
  if (mode === 'fail')
    process.exitCode = 1
}
else {
  console.log('资源预算检查通过。')
}
