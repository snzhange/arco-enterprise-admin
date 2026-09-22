import { useId } from 'react'

export function OverviewAreaChart({ values }: { values: number[] }) {
  const gradientId = useId().replaceAll(':', '')
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100
    const y = 92 - value
    return [x, y] as const
  })
  const linePath = points.reduce((path, point, index) => {
    if (index === 0)
      return `M ${point[0]} ${point[1]}`
    const previous = points[index - 1]
    const midpoint = (previous[0] + point[0]) / 2
    return `${path} C ${midpoint} ${previous[1]} ${midpoint} ${point[1]} ${point[0]} ${point[1]}`
  }, '')
  const areaPath = `${linePath} L 100 100 L 0 100 Z`

  return (
    <div className="overview-chart overview-area-chart" aria-label="内容数据趋势">
      <div className="overview-chart-axis">
        <span>70k</span>
        <span>60k</span>
        <span>50k</span>
        <span>40k</span>
        <span>30k</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#249AFF" stopOpacity=".26" />
            <stop offset="100%" stopColor="#249AFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" x2="1">
            <stop offset="0%" stopColor="#1EE7FF" />
            <stop offset="57%" stopColor="#249AFF" />
            <stop offset="100%" stopColor="#6F42FB" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} />)}
        <path className="overview-area-fill" d={areaPath} fill={`url(#${gradientId}-area)`} />
        <path className="overview-area-line" d={linePath} stroke={`url(#${gradientId}-line)`} />
      </svg>
      <div className="overview-chart-labels">
        {values.map((value, index) => <span key={value}>{`2026-${String(index + 1).padStart(2, '0')}`}</span>)}
      </div>
    </div>
  )
}
