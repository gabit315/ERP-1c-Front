import type { TrendPoint } from '../../services/aiAnalytics'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtAxis(v: number): string {
  if (v === 0) return '0'
  if (v >= 1000) {
    const m = v / 1000
    return m === Math.floor(m) ? `${m}М` : `${m.toFixed(1)}М`
  }
  return `${v}К`
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

interface TrendsChartProps {
  data: TrendPoint[]
}

const COLORS = { income: '#4ade80', expense: '#f87171', balance: '#60a5fa' }

export default function TrendsChart({ data }: TrendsChartProps) {
  if (data.length === 0) return null

  const W = 680, H = 200
  const P = { t: 12, r: 14, b: 28, l: 46 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b

  const allValues = data.flatMap(d => [d.income, d.expense, d.balance])
  const MAX_Y = Math.ceil(Math.max(...allValues) / 200) * 200
  const yTickStep = MAX_Y / 5
  const yTicks = Array.from({ length: 6 }, (_, i) => i * yTickStep)

  const n      = data.length
  const groupW = cW / n
  const barW   = groupW * 0.19
  const barGap = groupW * 0.02

  const xGroup = (i: number) => P.l + i * groupW + groupW * 0.12
  const yAt    = (v: number) => P.t + (1 - v / MAX_Y) * cH
  const bh     = (v: number) => (v / MAX_Y) * cH

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Тренды по месяцам</h2>
        <p className="text-xs text-gray-400 mt-0.5">Сравнение доходов, расходов и баланса</p>
      </div>
      <div className="p-5 flex flex-col gap-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          {/* grid + y-axis */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)}
                stroke="#f3f4f6" strokeWidth={1} />
              <text x={P.l - 5} y={yAt(v)} fontSize={9}
                textAnchor="end" dominantBaseline="middle" fill="#9ca3af">
                {fmtAxis(v)}
              </text>
            </g>
          ))}

          {/* grouped bars */}
          {data.map((d, i) => {
            const gx = xGroup(i)
            return (
              <g key={i}>
                <rect x={gx}                       y={yAt(d.income)}  width={barW} height={bh(d.income)}  fill={COLORS.income}  rx={2} />
                <rect x={gx + barW + barGap}       y={yAt(d.expense)} width={barW} height={bh(d.expense)} fill={COLORS.expense} rx={2} />
                <rect x={gx + 2*(barW + barGap)}   y={yAt(d.balance)} width={barW} height={bh(d.balance)} fill={COLORS.balance} rx={2} />
                {/* x-axis label centered on group */}
                <text
                  x={gx + barW + barGap}
                  y={H - 4}
                  fontSize={10} textAnchor="middle" fill="#9ca3af"
                >
                  {d.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* legend */}
        <div className="flex items-center gap-4">
          <LegendPill color={COLORS.income}  label="Доходы"  />
          <LegendPill color={COLORS.expense} label="Расходы" />
          <LegendPill color={COLORS.balance} label="Баланс"  />
        </div>
      </div>
    </div>
  )
}
