import { useState, useEffect, useCallback } from 'react'
import SectionCard from '../components/ui/SectionCard'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import {
  getAnalytics,
  PERIOD_LABELS,
  type PeriodLabel,
  type AnalyticsData,
  type LinePoint,
  type ExpenseSlice,
  type QuarterPoint,
  type AnalyticsInsights,
} from '../api/analytics'

// ─── color palette for expense donut ─────────────────────────────────────────

const SLICE_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#6b7280', '#ec4899', '#14b8a6']

// ─── SVG chart helpers ────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

/** Pick a nice axis ceiling: next clean multiple above max */
function niceCeil(maxVal: number, steps = 5): { max: number; ticks: number[] } {
  if (maxVal <= 0) return { max: 10, ticks: [0, 2, 4, 6, 8, 10] }
  const raw   = maxVal * 1.1
  const mag   = Math.pow(10, Math.floor(Math.log10(raw)))
  const step  = Math.ceil(raw / mag / steps) * (mag / steps) * steps / steps
  const nice  = step === 0 ? 1 : step
  const ceil  = Math.ceil(raw / nice) * nice
  const ticks: number[] = []
  for (let i = 0; i <= ceil + nice * 0.01; i += nice) ticks.push(parseFloat(i.toFixed(4)))
  return { max: ceil, ticks }
}

// ─── Line chart ───────────────────────────────────────────────────────────────

function RevenueLineChart({ data }: { data: LinePoint[] }) {
  const W = 480, H = 195
  const P = { t: 12, r: 12, b: 32, l: 46 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const n  = data.length

  const allVals = data.flatMap((d) => [d.income, d.expense]).filter((v) => v > 0)
  const rawMin  = allVals.length > 0 ? Math.min(...allVals) : 0
  const { max: MAX_Y, ticks: TICKS_Y } = niceCeil(
    allVals.length > 0 ? Math.max(...allVals) : 10
  )
  const MIN_Y = Math.max(0, Math.floor(rawMin * 0.85))

  const xAt = (i: number) => n > 1 ? P.l + (i / (n - 1)) * cW : P.l + cW / 2
  const yAt = (v: number) =>
    MAX_Y === MIN_Y
      ? P.t + cH / 2
      : P.t + (1 - (v - MIN_Y) / (MAX_Y - MIN_Y)) * cH

  const linePath = (key: 'income' | 'expense') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(d[key]).toFixed(1)}`).join(' ')

  return (
    <div style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {TICKS_Y.map((v) => (
          <g key={v}>
            <line x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={P.l - 6} y={yAt(v)} fontSize={10} textAnchor="end" dominantBaseline="middle" fill="#9ca3af">
              {v > 0 ? `${v}М` : '0'}
            </text>
          </g>
        ))}

        {data.length > 1 && (
          <>
            <path d={linePath('income')}  fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            <path d={linePath('expense')} fill="none" stroke="#f87171" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(d.income)}  r={3.5} fill="#4ade80" stroke="white" strokeWidth={1.5} />
            <circle cx={xAt(i)} cy={yAt(d.expense)} r={3.5} fill="#f87171" stroke="white" strokeWidth={1.5} />
            <text x={xAt(i)} y={H - 4} fontSize={11} textAnchor="middle" fill="#9ca3af">{d.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Donut / Pie chart ────────────────────────────────────────────────────────

function ExpenseDonutChart({ slices }: { slices: ExpenseSlice[] }) {
  const cx = 100, cy = 100, R = 80, RI = 46
  let angle = -Math.PI / 2

  const segments = slices.map((s, idx) => {
    const pct   = Math.max(0, Math.min(100, s.pct))
    const sweep = (pct / 100) * 2 * Math.PI
    const end   = angle + sweep
    const large = sweep > Math.PI ? 1 : 0
    const color = SLICE_COLORS[idx % SLICE_COLORS.length]

    const o1 = polar(cx, cy, R,  angle)
    const o2 = polar(cx, cy, R,  end)
    const i1 = polar(cx, cy, RI, angle)
    const i2 = polar(cx, cy, RI, end)

    const path = [
      `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
      `A ${R} ${R} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
      `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
      `A ${RI} ${RI} 0 ${large} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
      'Z',
    ].join(' ')

    angle = end
    return { ...s, path, color }
  })

  return (
    <div className="flex items-center gap-5">
      <div style={{ width: 200, height: 200, flexShrink: 0 }}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {segments.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        </svg>
      </div>
      <div className="flex flex-col gap-2.5 min-w-0">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 flex-1 truncate">{s.label}</span>
            <span className="text-xs font-semibold text-gray-700 shrink-0">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function QuarterlyBarChart({ data }: { data: QuarterPoint[] }) {
  const W = 680, H = 195
  const P = { t: 12, r: 16, b: 32, l: 46 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const n  = data.length

  const { max: MAX_Y, ticks: TICKS_Y } = niceCeil(
    data.length > 0 ? Math.max(...data.map((d) => d.value)) : 10
  )

  const slot = n > 0 ? cW / n : cW
  const barW = slot * 0.45
  const xAt  = (i: number) => P.l + slot * i + (slot - barW) / 2
  const yAt  = (v: number) => MAX_Y > 0 ? P.t + (1 - v / MAX_Y) * cH : P.t + cH

  return (
    <div style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {TICKS_Y.map((v) => (
          <g key={v}>
            <line x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={P.l - 6} y={yAt(v)} fontSize={10} textAnchor="end" dominantBaseline="middle" fill="#9ca3af">
              {v > 0 ? `${v}М` : '0'}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const bx = xAt(i)
          const by = yAt(d.value)
          const bh = Math.max(0, yAt(0) - by)
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW} height={bh} fill="#3b82f6" rx={3} />
              <text x={bx + barW / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#9ca3af">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Chart legend pill ────────────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-1 rounded-full" style={{ background: color }} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({
  title, main, description, scheme,
}: {
  title: string; main: string; description: string; scheme: 'green' | 'blue' | 'purple'
}) {
  const styles = {
    green:  { wrap: 'bg-green-50  border-green-100',  title: 'text-green-600',  main: 'text-green-700'  },
    blue:   { wrap: 'bg-blue-50   border-blue-100',   title: 'text-blue-600',   main: 'text-blue-700'   },
    purple: { wrap: 'bg-purple-50 border-purple-100', title: 'text-purple-600', main: 'text-purple-700' },
  }[scheme]

  return (
    <div className={`flex-1 rounded-lg border p-5 ${styles.wrap}`}>
      <p className={`text-xs font-medium mb-2 ${styles.title}`}>{title}</p>
      <p className={`text-xl font-bold leading-none mb-1.5 ${styles.main}`}>{main}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

function InsightCards({ insights }: { insights: AnalyticsInsights }) {
  return (
    <div className="flex gap-4">
      <InsightCard
        scheme="green"
        title="Основная тенденция"
        main="Рост доходов"
        description={`Доходы выросли на ${insights.incomeGrowthPct}% за период`}
      />
      <InsightCard
        scheme="blue"
        title="Самая большая статья расхода"
        main={insights.biggestExpenseCategory}
        description={`Составляет ${insights.biggestExpensePct}% от общих расходов`}
      />
      <InsightCard
        scheme="purple"
        title="Прибыльность"
        main={`${insights.averageMarginPct}% маржа`}
        description="Средняя рентабельность за период"
      />
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodLabel>('Последние 6 месяцев')

  const [data, setData]       = useState<ReturnType<typeof import('../api/analytics').getAnalytics> extends Promise<infer T> ? T : never | null>(null as any)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // ─── load ────────────────────────────────────────────────────────────────

  const load = useCallback((p: PeriodLabel) => {
    setLoading(true)
    setError(null)
    getAnalytics(p)
      .then(setData)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки аналитики')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(period)
  }, [period, load])

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────────── */}
        <PageHeaderWithAction
          title="Аналитика и визуализация"
          subtitle="Визуальное представление финансовых данных"
        />

        {/* ── filter card ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <div className="w-64 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Период анализа</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodLabel)}
              className="
                w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                bg-gray-50 text-gray-700
                focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300
                transition-colors
              "
            >
              {PERIOD_LABELS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── error state ──────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-600">{error}</span>
            <button
              onClick={() => load(period)}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline ml-4 shrink-0"
            >
              Повторить
            </button>
          </div>
        )}

        {/* ── loading state ────────────────────────────────────────────── */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-20">
            <span className="text-sm text-gray-400">Загрузка аналитики...</span>
          </div>
        )}

        {/* ── charts ───────────────────────────────────────────────────── */}
        {!loading && !error && data && (
          <>
            {/* top two-column row */}
            <div className="grid grid-cols-2 gap-4">
              <SectionCard title="Динамика доходов и расходов">
                <div className="flex flex-col gap-3">
                  {data.lineChart.length > 0 ? (
                    <RevenueLineChart data={data.lineChart} />
                  ) : (
                    <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                      Нет данных за период
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-1">
                    <LegendItem color="#4ade80" label="Доходы" />
                    <LegendItem color="#f87171" label="Расходы" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Распределение расходов">
                {data.expenseDistribution.length > 0 ? (
                  <ExpenseDonutChart slices={data.expenseDistribution} />
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                    Нет данных за период
                  </div>
                )}
              </SectionCard>
            </div>

            {/* full-width bar chart */}
            <SectionCard title="Общие доходы по кварталам">
              <div className="flex flex-col gap-3">
                {data.quarterlyIncome.length > 0 ? (
                  <QuarterlyBarChart data={data.quarterlyIncome} />
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                    Нет данных за период
                  </div>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <LegendItem color="#3b82f6" label="Доходы" />
                </div>
              </div>
            </SectionCard>

            {/* insight cards */}
            <InsightCards insights={data.insights} />
          </>
        )}

      </div>
    </div>
  )
}
