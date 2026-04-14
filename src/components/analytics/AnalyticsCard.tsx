import type { KPIForecast } from '../../services/aiAnalytics'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

// ─── variant config ───────────────────────────────────────────────────────────

const VARIANT = {
  balance: {
    card:   'bg-blue-50   border-blue-100',
    iconBg: 'bg-blue-100',
    icon:   <Wallet size={20} className="text-blue-600" />,
    pill:   'bg-blue-100   text-blue-700',
    label:  'Прогноз',
  },
  income: {
    card:   'bg-purple-50  border-purple-100',
    iconBg: 'bg-purple-100',
    icon:   <TrendingUp size={20} className="text-purple-600" />,
    pill:   'bg-purple-100  text-purple-700',
    label:  'Доход',
  },
  expense: {
    card:   'bg-orange-50  border-orange-100',
    iconBg: 'bg-orange-100',
    icon:   <TrendingDown size={20} className="text-orange-600" />,
    pill:   'bg-orange-100  text-orange-700',
    label:  'Расход',
  },
} as const

type Variant = keyof typeof VARIANT

// ─── component ────────────────────────────────────────────────────────────────

interface AnalyticsCardProps {
  variant:  Variant
  kpi:      KPIForecast
}

function NoteText({ text, up }: { text: string; up: boolean }) {
  return (
    <p className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-orange-500'}`}>
      {text}
    </p>
  )
}

export default function AnalyticsCard({ variant, kpi }: AnalyticsCardProps) {
  const cfg = VARIANT[variant]

  if (variant === 'balance') {
    const d = kpi.balance
    return (
      <div className={`flex-1 rounded-xl border p-5 flex flex-col gap-3 ${cfg.card}`}>
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${cfg.iconBg}`}>{cfg.icon}</div>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.pill}`}>
            {cfg.label}
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800 leading-none tabular-nums">{d.value}</p>
          <p className="text-xs text-gray-500 mt-1.5">{d.subtitle}</p>
        </div>
        <NoteText text={d.note} up={d.noteUp} />
      </div>
    )
  }

  if (variant === 'income') {
    const d = kpi.income
    return (
      <div className={`flex-1 rounded-xl border p-5 flex flex-col gap-3 ${cfg.card}`}>
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${cfg.iconBg}`}>{cfg.icon}</div>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.pill}`}>
            {cfg.label}
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800 leading-none tabular-nums">{d.value}</p>
          <p className="text-xs text-gray-500 mt-1.5">{d.subtitle}</p>
        </div>
        <p className="text-xs font-semibold text-purple-600">
          Высокая точность ({d.accuracy})
        </p>
      </div>
    )
  }

  // expense
  const d = kpi.expense
  return (
    <div className={`flex-1 rounded-xl border p-5 flex flex-col gap-3 ${cfg.card}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${cfg.iconBg}`}>{cfg.icon}</div>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.pill}`}>
          {cfg.label}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-none tabular-nums">{d.value}</p>
        <p className="text-xs text-gray-500 mt-1.5">{d.subtitle}</p>
      </div>
      <NoteText text={d.note} up={d.noteUp} />
    </div>
  )
}
