import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

export async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = entry.name
    const absolute = path.join(root, relative)
    if (entry.isDirectory())
      files.push(...(await listFiles(absolute)).map(file => path.join(relative, file)))
    else if (entry.isFile())
      files.push(relative)
  }
  return files
}

export async function compareDirectories(expectedRoot, actualRoot) {
  const [expectedFiles, actualFiles] = await Promise.all([
    listFiles(expectedRoot),
    listFiles(actualRoot),
  ])
  const files = [...new Set([...expectedFiles, ...actualFiles])].sort()
  const differences = []
  for (const file of files) {
    const expectedPath = path.join(expectedRoot, file)
    const actualPath = path.join(actualRoot, file)
    let expected
    let actual
    try {
      expected = await readFile(expectedPath)
    }
    catch (error) {
      if (error?.code !== 'ENOENT')
        throw error
    }
    try {
      actual = await readFile(actualPath)
    }
    catch (error) {
      if (error?.code !== 'ENOENT')
        throw error
    }
    if (!expected || !actual || !expected.equals(actual))
      differences.push(file)
  }
  return differences
}
