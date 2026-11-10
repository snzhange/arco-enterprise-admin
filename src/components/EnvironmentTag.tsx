import { Tag, Tooltip } from '@arco-design/web-react'

import { useLocale } from '@/app/i18n'

interface EnvironmentTagProps {
  className?: string
  environment?: string | null
  environmentName?: string | null
}

/** Read-only deployment badge; production uses the danger palette as a safety cue. */
export function EnvironmentTag({ className, environment, environmentName }: EnvironmentTagProps) {
  const t = useLocale()
  const name = environmentName?.trim() || environment?.trim()
  if (!name)
    return null
  const production = environment?.startsWith('prod') === true
  return (
    <Tooltip content={t('environment.tooltip').replace('{environment}', environment?.trim() || name)}>
      <Tag
        className={['environment-tag', className].filter(Boolean).join(' ')}
        color={production ? 'red' : 'arcoblue'}
        bordered
      >
        {name}
      </Tag>
    </Tooltip>
  )
}
