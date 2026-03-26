import { useState } from 'react'
import SectionCard from '../components/ui/SectionCard'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'

// ─── static data ──────────────────────────────────────────────────────────────

const PERIODS = ['Последние 6 месяцев', 'Текущий год', 'Прошлый год', 'Все время']

const LINE_DATA = [
  { label: 'Сен', income: 6.5, expense: 5.0 },
  { label: 'Окт', income: 7.0, expense: 5.5 },
  { label: 'Ноя', income: 7.2, expense: 5.8 },
  { label: 'Дек', income: 7.8, expense: 6.0 },
  { label: 'Янв', income: 8.0, expense: 5.8 },
  { label: 'Фев', income: 7.8, expense: 6.1 },
  { label: 'Мар', income: 8.2, expense: 6.1 },
]

const PIE_SLICES = [
  { label: 'Зарплата',    pct: 67, color: '#3b82f6' },
  { label: 'Аренда',      pct: 14, color: '#8b5cf6' },
  { label: 'Коммунальные', pct: 5, color: '#22c55e' },
  { label: 'Канцелярия',  pct: 5,  color: '#f97316' },
  { label: 'Прочее',      pct: 9,  color: '#6b7280' },
]

const BAR_DATA = [
  { label: 'Q1 2025', value: 19.5 },
  { label: 'Q2 2025', value: 21.0 },
  { label: 'Q3 2025', value: 22.5 },
  { label: 'Q4 2025', value: 22.8 },
  { label: 'Q1 2026', value: 23.2 },
]

// ─── SVG chart helpers ────────────────────────────────────────────────────────

/** Convert polar to Cartesian, angles in radians */
function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

// ─── Line chart ───────────────────────────────────────────────────────────────

function RevenueLineChart() {
  const W = 480, H = 195
  const P = { t: 12, r: 12, b: 32, l: 46 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const MIN_Y = 4, MAX_Y = 10
  const TICKS_Y = [4, 6, 8, 10]
  const n = LINE_DATA.length

  const xAt = (i: number) => P.l + (i / (n - 1)) * cW
  const yAt = (v: number) => P.t + (1 - (v - MIN_Y) / (MAX_Y - MIN_Y)) * cH

  const linePath = (key: 'income' | 'expense') =>
    LINE_DATA.map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(d[key]).toFixed(1)}`).join(' ')

  return (
    <div style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* horizontal grid lines + y labels */}
        {TICKS_Y.map((v) => (
          <g key={v}>
            <line
              x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)}
              stroke="#f3f4f6" strokeWidth={1}
            />
            <text
              x={P.l - 6} y={yAt(v)}
              fontSize={10} textAnchor="end" dominantBaseline="middle" fill="#9ca3af"
            >
              {v}М
            </text>
          </g>
        ))}

        {/* income line */}
        <path d={linePath('income')} fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {LINE_DATA.map((d, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(d.income)} r={3.5}
            fill="#4ade80" stroke="white" strokeWidth={1.5} />
        ))}

        {/* expense line */}
        <path d={linePath('expense')} fill="none" stroke="#f87171" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {LINE_DATA.map((d, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(d.expense)} r={3.5}
            fill="#f87171" stroke="white" strokeWidth={1.5} />
        ))}

        {/* x-axis labels */}
        {LINE_DATA.map((d, i) => (
          <text key={i} x={xAt(i)} y={H - 4}
            fontSize={11} textAnchor="middle" fill="#9ca3af">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ─── Donut / Pie chart ────────────────────────────────────────────────────────

function ExpenseDonutChart() {
  const cx = 100, cy = 100, R = 80, RI = 46
  let angle = -Math.PI / 2

  const segments = PIE_SLICES.map((s) => {
    const sweep = (s.pct / 100) * 2 * Math.PI
    const end = angle + sweep
    const large = sweep > Math.PI ? 1 : 0

    const o1 = polar(cx, cy, R, angle)
    const o2 = polar(cx, cy, R, end)
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
    return { ...s, path }
  })

  return (
    <div className="flex items-center gap-5">
      {/* donut */}
      <div style={{ width: 200, height: 200, flexShrink: 0 }}>
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {segments.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} />
          ))}
        </svg>
      </div>

      {/* legend */}
      <div className="flex flex-col gap-2.5 min-w-0">
        {PIE_SLICES.map((s) => (
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

function QuarterlyBarChart() {
  const W = 680, H = 195
  const P = { t: 12, r: 16, b: 32, l: 46 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const MAX_Y = 26
  const TICKS_Y = [0, 5, 10, 15, 20, 25]
  const n = BAR_DATA.length
  const slot = cW / n
  const barW = slot * 0.45

  const xAt = (i: number) => P.l + slot * i + (slot - barW) / 2
  const yAt = (v: number) => P.t + (1 - v / MAX_Y) * cH

  return (
    <div style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* horizontal grid lines + y labels */}
        {TICKS_Y.map((v) => (
          <g key={v}>
            <line
              x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)}
              stroke="#f3f4f6" strokeWidth={1}
            />
            <text
              x={P.l - 6} y={yAt(v)}
              fontSize={10} textAnchor="end" dominantBaseline="middle" fill="#9ca3af"
            >
              {v > 0 ? `${v}М` : '0'}
            </text>
          </g>
        ))}

        {/* bars */}
        {BAR_DATA.map((d, i) => {
          const bx = xAt(i)
          const by = yAt(d.value)
          const bh = yAt(0) - by
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW} height={bh} fill="#3b82f6" rx={3} />
              <text
                x={bx + barW / 2} y={H - 4}
                fontSize={11} textAnchor="middle" fill="#9ca3af"
              >
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
  title,
  main,
  description,
  scheme,
}: {
  title: string
  main: string
  description: string
  scheme: 'green' | 'blue' | 'purple'
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('Последние 6 месяцев')

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
              onChange={(e) => setPeriod(e.target.value)}
              className="
                w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                bg-gray-50 text-gray-700
                focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300
                transition-colors
              "
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── top two-column chart row ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* line chart */}
          <SectionCard title="Динамика доходов и расходов">
            <div className="flex flex-col gap-3">
              <RevenueLineChart />
              <div className="flex items-center gap-4 pt-1">
                <LegendItem color="#4ade80" label="Доходы" />
                <LegendItem color="#f87171" label="Расходы" />
              </div>
            </div>
          </SectionCard>

          {/* donut chart */}
          <SectionCard title="Распределение расходов">
            <ExpenseDonutChart />
          </SectionCard>

        </div>

        {/* ── full-width bar chart ─────────────────────────────────────── */}
        <SectionCard title="Общие доходы по кварталам">
          <div className="flex flex-col gap-3">
            <QuarterlyBarChart />
            <div className="flex items-center gap-4 pt-1">
              <LegendItem color="#3b82f6" label="Доходы" />
            </div>
          </div>
        </SectionCard>

        {/* ── insight cards ────────────────────────────────────────────── */}
        <div className="flex gap-4">
          <InsightCard
            scheme="green"
            title="Основная тенденция"
            main="Рост доходов"
            description="Доходы выросли на 26% за последние 7 месяцев"
          />
          <InsightCard
            scheme="blue"
            title="Самая большая статья расхода"
            main="Зарплата"
            description="Составляет 67% от общих расходов"
          />
          <InsightCard
            scheme="purple"
            title="Прибыльность"
            main="26% маржа"
            description="Средняя рентабельность за период"
          />
        </div>

      </div>
    </div>
  )
}
