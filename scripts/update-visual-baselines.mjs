import { spawnSync } from 'node:child_process'
import process from 'node:process'

if (process.platform !== 'linux') {
  console.error('视觉基线固定为 Linux Chromium，请在 Linux CI 或 Playwright 容器中运行此命令。')
  process.exit(1)
}

const result = spawnSync('pnpm', ['exec', 'playwright', 'test', 'e2e/visual.spec.ts', '--update-snapshots'], {
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_PROJECT: 'visual' },
})

process.exit(result.status ?? 1)
