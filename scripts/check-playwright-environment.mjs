import { execFileSync } from 'node:child_process'
import process from 'node:process'

const expected = {
  node: '22',
  project: process.env.PLAYWRIGHT_PROJECT === 'visual' ? 'chromium-linux' : 'functional-chromium-linux',
  viewport: process.env.PLAYWRIGHT_PROJECT === 'visual' ? '1440x900' : '1280x800',
  deviceScaleFactor: '1',
}

const nodeMajor = process.versions.node.split('.')[0]
const actual = {
  node: nodeMajor,
  platform: `${process.platform}-${process.arch}`,
  project: expected.project,
  viewport: expected.viewport,
  deviceScaleFactor: expected.deviceScaleFactor,
}

if (process.platform !== 'linux') {
  console.error(JSON.stringify({ ok: false, expected: { platform: 'linux', ...expected }, actual }, null, 2))
  process.exit(1)
}

let browserVersion = 'unknown'
try {
  browserVersion = execFileSync('pnpm', ['exec', 'playwright', '--version'], { encoding: 'utf8' }).trim()
}
catch {
  console.error('无法读取 Playwright 版本')
  process.exit(1)
}

const result = { ok: nodeMajor === expected.node, expected: { platform: 'linux', ...expected }, actual: { ...actual, browserVersion } }
console.log(JSON.stringify(result, null, 2))
if (!result.ok)
  process.exit(1)
