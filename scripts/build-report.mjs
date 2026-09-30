import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { gzipSync } from 'node:zlib'

const projectRoot = process.cwd()
const outputRoot = path.resolve(projectRoot, process.argv.find(argument => argument.startsWith('--root='))?.slice('--root='.length) || 'dist')
const outputPath = path.resolve(projectRoot, process.argv.find(argument => argument.startsWith('--out='))?.slice('--out='.length) || path.join(outputRoot, 'build-assets-report.json'))
const sourceRoot = path.resolve(projectRoot, 'src/assets')

const mediaExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])

async function listFiles(directory, relative = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryRelative = path.join(relative, entry.name)
    if (entry.isDirectory())
      files.push(...await listFiles(path.join(directory, entry.name), entryRelative))
    else if (entry.isFile())
      files.push(entryRelative)
  }
  return files
}

function classify(file) {
  const extension = path.extname(file).toLowerCase()
  if (extension === '.js')
    return 'javascript'
  if (extension === '.css')
    return 'css'
  if (mediaExtensions.has(extension))
    return 'media'
  return undefined
}

function isEntry(file) {
  return /(?:^|[\\/])index(?:-[^/]+)?\.(?:js|css)$/.test(file)
}

async function measureFiles(root, relativeFiles, source = false) {
  const measurements = []
  for (const relative of relativeFiles) {
    const type = classify(relative)
    if (!type)
      continue
    const bytes = await readFile(path.join(root, relative))
    measurements.push({
      path: source ? relative.replaceAll('\\', '/') : relative.replaceAll('\\', '/'),
      type,
      bytes: bytes.byteLength,
      gzipBytes: gzipSync(bytes, { level: 9 }).byteLength,
      entry: !source && isEntry(relative),
    })
  }
  return measurements
}

function sum(files, key) {
  return files.reduce((total, file) => total + file[key], 0)
}

function summarize(files) {
  const javascript = files.filter(file => file.type === 'javascript')
  const css = files.filter(file => file.type === 'css')
  const media = files.filter(file => file.type === 'media')
  const entries = files.filter(file => file.entry)
  return {
    fileCount: files.length,
    javascriptGzipBytes: sum(javascript, 'gzipBytes'),
    cssGzipBytes: sum(css, 'gzipBytes'),
    mediaBytes: sum(media, 'bytes'),
    mediaGzipBytes: sum(media, 'gzipBytes'),
    entryGzipBytes: sum(entries, 'gzipBytes'),
    entryFiles: entries.map(file => file.path),
    maxJavaScriptGzipBytes: Math.max(0, ...javascript.map(file => file.gzipBytes)),
    maxCssGzipBytes: Math.max(0, ...css.map(file => file.gzipBytes)),
    maxMediaBytes: Math.max(0, ...media.map(file => file.bytes)),
    maxMediaGzipBytes: Math.max(0, ...media.map(file => file.gzipBytes)),
  }
}

const distFiles = await measureFiles(outputRoot, await listFiles(outputRoot))
const sourceFiles = await measureFiles(sourceRoot, await listFiles(sourceRoot), true)
const report = {
  version: 1,
  generatedAt: new Date().toISOString(),
  root: path.relative(projectRoot, outputRoot) || '.',
  metrics: summarize(distFiles),
  sourceMetrics: summarize(sourceFiles),
  files: distFiles.sort((left, right) => right.gzipBytes - left.gzipBytes),
  sourceFiles: sourceFiles.sort((left, right) => right.bytes - left.bytes),
}

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(`构建资源报告：${path.relative(projectRoot, outputPath)}`)
console.log(JSON.stringify(report.metrics, null, 2))
