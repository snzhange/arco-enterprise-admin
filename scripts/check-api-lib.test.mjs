import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { compareDirectories, listFiles } from './check-api-lib.mjs'

const roots = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'arco-api-fixture-'))
  roots.push(root)
  return root
}

describe('api generation directory comparison', () => {
  it('passes when generated files have identical bytes', async () => {
    const root = await fixture()
    const expected = path.join(root, 'expected')
    const actual = path.join(root, 'actual')
    await Promise.all([mkdir(expected, { recursive: true }), mkdir(actual, { recursive: true })])
    await Promise.all([
      writeFile(path.join(expected, 'nested.ts'), 'export const value = 1\n'),
      writeFile(path.join(actual, 'nested.ts'), 'export const value = 1\n'),
    ])
    await expect(compareDirectories(expected, actual)).resolves.toEqual([])
  })

  it('reports changed, missing and untracked generated files', async () => {
    const root = await fixture()
    const expected = path.join(root, 'expected')
    const actual = path.join(root, 'actual')
    await Promise.all([mkdir(expected, { recursive: true }), mkdir(actual, { recursive: true })])
    await Promise.all([
      writeFile(path.join(expected, 'changed.ts'), 'old\n'),
      writeFile(path.join(actual, 'changed.ts'), 'new\n'),
      writeFile(path.join(expected, 'missing.ts'), 'tracked\n'),
      writeFile(path.join(actual, 'untracked.ts'), 'generated\n'),
    ])
    await expect(compareDirectories(expected, actual)).resolves.toEqual(['changed.ts', 'missing.ts', 'untracked.ts'])
    await expect(listFiles(actual)).resolves.toEqual(['changed.ts', 'untracked.ts'])
  })
})
