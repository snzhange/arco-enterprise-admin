import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

import { validate } from '@scalar/openapi-parser'

import { compareDirectories } from './check-api-lib.mjs'

const contractPath = 'openapi/admin-api.yaml'
const generatedPath = 'src/api/generated'

export function formatContractError(message, error) {
  return [`契约检查失败：${message}`, error ? (error instanceof Error ? error.message : String(error)) : ''].filter(Boolean).join('\n')
}

function responseContent(response, name) {
  const content = response?.content
  return content && typeof content === 'object' ? content[name] : undefined
}

function assertProblemResponses(specification) {
  const paths = specification?.paths
  if (!paths || typeof paths !== 'object')
    throw new Error('paths 缺失或不是对象')

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object')
      continue
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(method))
        continue
      const responses = operation?.responses
      if (!responses || typeof responses !== 'object')
        throw new Error(`${method.toUpperCase()} ${path} 缺少 responses`)
      for (const status of ['400', '401', '403', '404', '500', '503']) {
        const response = responses[status]
        if (!response)
          continue
        if ('$ref' in response)
          continue
        const problem = responseContent(response, 'application/problem+json')
        if (!problem)
          throw new Error(`${method.toUpperCase()} ${path} ${status} 必须声明 application/problem+json`)
        if (problem.schema?.$ref !== '#/components/schemas/ProblemDetail')
          throw new Error(`${method.toUpperCase()} ${path} ${status} 必须引用 ProblemDetail`)
      }
    }
  }

  const components = specification?.components?.responses
  for (const name of ['BadRequest', 'Unauthorized', 'Forbidden', 'NotFound', 'InternalServerError', 'ServiceUnavailable']) {
    const response = components?.[name]
    if (!response)
      throw new Error(`components.responses.${name} 缺失`)
    const problem = responseContent(response, 'application/problem+json')
    if (!problem || problem.schema?.$ref !== '#/components/schemas/ProblemDetail')
      throw new Error(`components.responses.${name} 必须使用 ProblemDetail`)
  }
}

let temporaryWorkspace
try {
  const source = await readFile(contractPath, 'utf8')
  const result = await validate(source, { throwOnError: false })
  if (!result.valid) {
    throw new Error(`${contractPath} 未通过 OpenAPI 校验：${JSON.stringify(result.errors)}`)
  }
  assertProblemResponses(result.specification)
  temporaryWorkspace = await mkdtemp(path.join(os.tmpdir(), 'arco-api-check-'))
  const generatedOutput = path.join(process.cwd(), '.orval-temp', generatedPath)
  execFileSync('pnpm', ['exec', 'orval', '--config', './orval.config.ts'], {
    stdio: 'inherit',
    env: { ...process.env, ORVAL_OUTPUT_ROOT: temporaryWorkspace },
  })
  const generatedFile = path.join(generatedOutput, 'admin-api.ts')
  const generatedSource = await readFile(generatedFile, 'utf8')
  await writeFile(generatedFile, generatedSource.replaceAll('../../../../src/api/http', '../http'))
  const differences = await compareDirectories(generatedPath, generatedOutput)
  if (differences.length)
    throw new Error(`${generatedPath} 存在生成差异：\n${differences.map(file => `- ${file}`).join('\n')}`)
  execFileSync('pnpm', ['typecheck'], { stdio: 'inherit' })
  console.log('契约检查通过：OpenAPI 有效、Problem Details 完整、生成目录零 diff、类型检查通过。')
}
catch (error) {
  console.error(formatContractError('执行校验或生成命令时发生错误', error))
  console.error('请先修改 OpenAPI 契约，再运行 pnpm generate:api，并提交生成目录。')
  process.exitCode = 1
}
finally {
  await rm(path.join(process.cwd(), '.orval-temp'), { recursive: true, force: true })
  if (temporaryWorkspace)
    await rm(temporaryWorkspace, { recursive: true, force: true })
}
