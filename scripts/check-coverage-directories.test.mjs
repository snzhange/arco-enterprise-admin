import { describe, expect, it } from 'vitest'

describe('coverage directory configuration', () => {
  it('keeps thresholds and baselines for every declared directory', async () => {
    const config = await import('../config/coverage-directories.json', { with: { type: 'json' } })
    const baseline = await import('../config/coverage-baseline.json', { with: { type: 'json' } })
    for (const directory of config.default.directories) {
      expect(baseline.default.directories[directory.name]).toBeDefined()
      for (const metric of ['lines', 'statements', 'branches', 'functions'])
        expect(directory.thresholds[metric]).toBeGreaterThan(0)
    }
  })
})
