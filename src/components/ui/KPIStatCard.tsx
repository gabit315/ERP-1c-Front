import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Trend = 'up' | 'down' | 'neutral'

interface KPIStatCardProps {
  title: string
  value: string
  subtitle?: string
  subtitleClass?: string
  icon: React.ReactNode
  iconBg?: string
  trend?: Trend
  trendLabel?: string
}

const trendConfig: Record<Trend, { icon: React.ReactNode; color: string }> = {
  up: { icon: <TrendingUp size={13} />, color: 'text-green-600' },
  down: { icon: <TrendingDown size={13} />, color: 'text-red-500' },
  neutral: { icon: <Minus size={13} />, color: 'text-gray-400' },
}

export default function KPIStatCard({
  title,
  value,
  subtitle,
  subtitleClass = 'text-gray-400',
  icon,
  iconBg = 'bg-blue-50',
  trend,
  trendLabel,
}: KPIStatCardProps) {
  const tc = trend ? trendConfig[trend] : null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 leading-snug">{title}</span>
        <span className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
          {icon}
        </span>
      </div>

      <div>
        <p className="text-xl font-semibold text-gray-800 leading-none">{value}</p>
        {subtitle && (
          <p className={`text-xs mt-1 ${subtitleClass}`}>{subtitle}</p>
        )}
      </div>

      {tc && trendLabel && (
        <div className={`flex items-center gap-1 text-xs ${tc.color}`}>
          {tc.icon}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  )
}
