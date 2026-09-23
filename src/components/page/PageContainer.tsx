import type { ReactNode } from 'react'

import { Typography } from '@arco-design/web-react'
import { useId } from 'react'

const { Text, Title } = Typography

export interface PageContainerProps {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function PageContainer({
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
}: PageContainerProps) {
  const titleId = useId()

  return (
    <section className={['page-container', 'page-container-primitive', className].filter(Boolean).join(' ')} aria-labelledby={titleId}>
      <header className="page-heading page-container-heading">
        <div>
          {eyebrow && <Text className="eyebrow">{eyebrow}</Text>}
          <Title id={titleId} heading={2}>{title}</Title>
          {description && <Text type="secondary">{description}</Text>}
        </div>
        {actions && <div className="page-container-actions">{actions}</div>}
      </header>
      {children}
    </section>
  )
}
