import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const config = JSON.parse(await readFile(path.resolve(root, 'config/coverage-directories.json'), 'utf8'))
const summary = JSON.parse(await readFile(path.resolve(root, 'coverage/coverage-summary.json'), 'utf8'))
const baseline = JSON.parse(await readFile(path.resolve(root, config.baseline), 'utf8'))
const metrics = ['lines', 'statements', 'branches', 'functions']
const files = Object.entries(summary).filter(([file]) => file !== 'total')

function aggregate(directory) {
  const prefix = `${root}/${directory.path}/`.replaceAll('\\', '/')
  const selected = files.filter(([file]) => {
    const normalized = file.replaceAll('\\', '/')
    if (!normalized.startsWith(prefix))
      return false
    const relative = normalized.slice(prefix.length)
    return !relative.includes('/')
  })
  const totals = Object.fromEntries(metrics.map(metric => [metric, { covered: 0, total: 0 }]))
  for (const [, value] of selected) {
    for (const metric of metrics) {
      totals[metric].covered += value[metric].covered
      totals[metric].total += value[metric].total
    }
  }
  return Object.fromEntries(metrics.map(metric => [metric, totals[metric].total ? Number((totals[metric].covered / totals[metric].total * 100).toFixed(2)) : 100]))
}

const result = { generatedAt: new Date().toISOString(), directories: {} }
const failures = []
for (const directory of config.directories) {
  const actual = aggregate(directory)
  const previous = baseline.directories[directory.name] || {}
  const entry = { ...actual, baseline: previous, status: 'pass', deltas: {} }
  for (const metric of metrics) {
    entry.deltas[metric] = Number((actual[metric] - (previous[metric] ?? actual[metric])).toFixed(2))
    if (actual[metric] < directory.thresholds[metric] || entry.deltas[metric] < -directory.maxRegression) {
      entry.status = 'fail'
      failures.push({ directory: directory.name, metric, actual: actual[metric], target: directory.thresholds[metric], baseline: previous[metric], maxRegression: directory.maxRegression })
    }
  }
  result.directories[directory.name] = entry
}

await writeFile(path.resolve(root, 'coverage/coverage-directories.json'), `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({ ...result, failures }, null, 2))
if (failures.length) {
  console.error(`目录覆盖率门禁失败：${failures.length} 项`)
  process.exitCode = 1
}
