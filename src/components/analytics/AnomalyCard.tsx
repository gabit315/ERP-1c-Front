import { Calendar } from 'lucide-react'
import type { Anomaly } from '../../services/aiAnalytics'

// ─── severity config ──────────────────────────────────────────────────────────

const SEVERITY_CFG = {
  danger: {
    wrap:  'bg-red-50    border-red-100',
    title: 'text-red-700',
    meta:  'text-red-400',
    badge: 'bg-red-100    text-red-700',
  },
  warning: {
    wrap:  'bg-amber-50  border-amber-100',
    title: 'text-amber-700',
    meta:  'text-amber-400',
    badge: 'bg-amber-100  text-amber-700',
  },
  info: {
    wrap:  'bg-orange-50 border-orange-100',
    title: 'text-orange-700',
    meta:  'text-orange-400',
    badge: 'bg-orange-100 text-orange-700',
  },
} as const

// ─── component ────────────────────────────────────────────────────────────────

interface AnomalyCardProps {
  anomaly: Anomaly
}

export default function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const s = SEVERITY_CFG[anomaly.severity]

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-4 ${s.wrap}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold mb-1 ${s.title}`}>
          {anomaly.title}
        </p>
        <p className="text-xs text-gray-600 mb-2 leading-relaxed">
          {anomaly.description}
        </p>
        <div className={`flex items-center gap-1 text-xs ${s.meta}`}>
          <Calendar size={11} />
          <span>{anomaly.date}</span>
        </div>
      </div>
      <span className={`text-sm font-bold px-3 py-1 rounded-lg shrink-0 tabular-nums ${s.badge}`}>
        {anomaly.amount}
      </span>
    </div>
  )
}
