import type { ReactNode } from 'react'

import { Typography } from '@arco-design/web-react'
import { useId } from 'react'

const { Text, Title } = Typography

export interface PageContainerProps {
  title?: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  showHeader?: boolean
}

export function PageContainer({
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
  showHeader = true,
}: PageContainerProps) {
  const titleId = useId()
  const hasHeader = showHeader && (title || description || eyebrow || actions)

  if (!hasHeader)
    return <>{children}</>

  return (
    <section className={['page-container', 'page-container-primitive', className].filter(Boolean).join(' ')} aria-labelledby={title ? titleId : undefined}>
      <header className="page-heading page-container-heading">
        <div>
          {eyebrow && <Text className="eyebrow">{eyebrow}</Text>}
          {title && <Title id={titleId} heading={2}>{title}</Title>}
          {description && <Text type="secondary">{description}</Text>}
        </div>
        {actions && <div className="page-container-actions">{actions}</div>}
      </header>
      {children}
    </section>
  )
}
