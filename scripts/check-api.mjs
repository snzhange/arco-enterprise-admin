import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import process from 'node:process'

import { validate } from '@scalar/openapi-parser'

const contractPath = 'openapi/admin-api.yaml'
const generatedPath = 'src/api/generated'

function fail(message, error) {
  console.error(`契约检查失败：${message}`)
  if (error)
    console.error(error instanceof Error ? error.message : String(error))
  console.error('请先修改 OpenAPI 契约，再运行 pnpm generate:api，并提交生成目录。')
  process.exitCode = 1
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

try {
  const source = await readFile(contractPath, 'utf8')
  const result = await validate(source, { throwOnError: false })
  if (!result.valid) {
    fail(`${contractPath} 未通过 OpenAPI 校验`, result.errors)
    process.exit()
  }
  assertProblemResponses(result.specification)
  execFileSync('pnpm', ['generate:api'], { stdio: 'inherit' })
  try {
    execFileSync('git', ['diff', '--quiet', '--', generatedPath], { stdio: 'inherit' })
  }
  catch {
    fail(`${generatedPath} 存在生成差异`)
    process.exit()
  }
  execFileSync('pnpm', ['typecheck'], { stdio: 'inherit' })
  console.log('契约检查通过：OpenAPI 有效、Problem Details 完整、生成目录零 diff、类型检查通过。')
}
catch (error) {
  fail('执行校验或生成命令时发生错误', error)
}
