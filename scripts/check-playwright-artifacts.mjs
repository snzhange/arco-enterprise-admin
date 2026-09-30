import { existsSync, readdirSync } from 'node:fs'
import process from 'node:process'

const project = process.env.PLAYWRIGHT_PROJECT === 'visual' ? 'visual' : 'functional'
const reportDir = `playwright-report/${project}`
const resultsDir = `test-results/${project}`

if (!existsSync(reportDir) || !existsSync(resultsDir)) {
  console.error(`缺少 ${project} Playwright 报告或测试结果目录`)
  process.exit(1)
}

const reportEntries = readdirSync(reportDir)
const resultEntries = readdirSync(resultsDir)
console.log(JSON.stringify({ project, reportDir, resultsDir, reportEntries, resultEntries }, null, 2))
