import { useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Lightbulb,
  Info,
} from 'lucide-react'
import SectionCard from '../components/ui/SectionCard'

// ─── static data ──────────────────────────────────────────────────────────────

const PERIODS = ['Последние 6 месяцев', 'Последний год', 'Все время']

interface ForecastPt {
  label: string
  actual: number | null   // ₸ thousands
  forecast: number | null // ₸ thousands
}

const EXPENSE_FORECAST: ForecastPt[] = [
  { label: 'Январь',  actual: 750,  forecast: null },
  { label: 'Февраль', actual: 780,  forecast: null },
  { label: 'Март',    actual: 820,  forecast: 820  },
  { label: 'Апрель',  actual: null, forecast: 850  },
  { label: 'Май',     actual: null, forecast: 882  },
  { label: 'Июнь',    actual: null, forecast: 910  },
]

const INCOME_FORECAST: ForecastPt[] = [
  { label: 'Январь',  actual: 1050, forecast: null },
  { label: 'Февраль', actual: 1100, forecast: null },
  { label: 'Март',    actual: 1150, forecast: 1150 },
  { label: 'Апрель',  actual: null, forecast: 1210 },
  { label: 'Май',     actual: null, forecast: 1265 },
  { label: 'Июнь',    actual: null, forecast: 1320 },
]

const TRENDS_DATA = [
  { label: 'Янв', income: 1050, expense: 750,  balance: 300 },
  { label: 'Фев', income: 1100, expense: 780,  balance: 320 },
  { label: 'Мар', income: 1150, expense: 820,  balance: 330 },
  { label: 'Апр', income: 1210, expense: 850,  balance: 360 },
  { label: 'Май', income: 1265, expense: 882,  balance: 383 },
  { label: 'Июн', income: 1320, expense: 910,  balance: 410 },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtAxis(v: number): string {
  if (v === 0) return '0'
  if (v >= 1000) {
    const m = v / 1000
    return m === Math.floor(m) ? `${m}М` : `${m.toFixed(1)}М`
  }
  return `${v}К`
}

// ─── Legend pill ──────────────────────────────────────────────────────────────

function Legend({
  items,
}: {
  items: { color: string; dash?: boolean; label: string }[]
}) {
  return (
    <div className="flex items-center gap-4 pt-1">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          {it.dash ? (
            <svg width={18} height={6}>
              <line
                x1={0} y1={3} x2={18} y2={3}
                stroke={it.color} strokeWidth={2}
                strokeDasharray="4,3"
              />
            </svg>
          ) : (
            <div className="w-3.5 h-1 rounded-full" style={{ background: it.color }} />
          )}
          <span className="text-xs text-gray-500">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Forecast area chart ──────────────────────────────────────────────────────

function ForecastAreaChart({
  data,
  actualColor,
  minY,
  maxY,
  tickStep,
}: {
  data: ForecastPt[]
  actualColor: string
  minY: number
  maxY: number
  tickStep: number
}) {
  const W = 440, H = 185
  const P = { t: 10, r: 10, b: 28, l: 44 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const n = data.length

  const xAt = (i: number) => P.l + (i / (n - 1)) * cW
  const yAt = (v: number) => P.t + (1 - (v - minY) / (maxY - minY)) * cH
  const yBase = P.t + cH

  const actualPts = data
    .map((d, i) => d.actual !== null ? { x: xAt(i), y: yAt(d.actual) } : null)
    .filter(Boolean) as { x: number; y: number }[]

  const forecastPts = data
    .map((d, i) => d.forecast !== null ? { x: xAt(i), y: yAt(d.forecast) } : null)
    .filter(Boolean) as { x: number; y: number }[]

  const areaPath = (pts: { x: number; y: number }[]) => pts.length < 2 ? '' : [
    `M ${pts[0].x.toFixed(1)} ${yBase}`,
    ...pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${pts[pts.length - 1].x.toFixed(1)} ${yBase}`,
    'Z',
  ].join(' ')

  const linePath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  const ticks: number[] = []
  for (let v = minY; v <= maxY + tickStep * 0.1; v += tickStep) ticks.push(Math.round(v))

  return (
    <div style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* grid + y-labels */}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={P.l - 4} y={yAt(v)} fontSize={9} textAnchor="end" dominantBaseline="middle" fill="#9ca3af">
              {fmtAxis(v)}
            </text>
          </g>
        ))}

        {/* actual area */}
        <path d={areaPath(actualPts)} fill={actualColor} fillOpacity={0.1} />
        {/* forecast area */}
        <path d={areaPath(forecastPts)} fill="#8b5cf6" fillOpacity={0.07} />

        {/* actual line */}
        <path d={linePath(actualPts)} fill="none" stroke={actualColor} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />
        {/* forecast line */}
        <path d={linePath(forecastPts)} fill="none" stroke="#8b5cf6" strokeWidth={2.5}
          strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />

        {/* actual markers */}
        {actualPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={actualColor} stroke="white" strokeWidth={1.5} />
        ))}
        {/* forecast markers (skip first = transition point shared with actual) */}
        {forecastPts.slice(1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#8b5cf6" stroke="white" strokeWidth={1.5} />
        ))}

        {/* x-axis labels */}
        {data.map((d, i) => (
          <text key={i} x={xAt(i)} y={H - 4} fontSize={10} textAnchor="middle" fill="#9ca3af">
            {d.label.substring(0, 3)}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ─── Monthly grouped bar chart ────────────────────────────────────────────────

function MonthlyTrendsChart() {
  const W = 680, H = 200
  const P = { t: 12, r: 14, b: 28, l: 46 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const MAX_Y = 1500
  const Y_TICKS = [0, 300, 600, 900, 1200, 1500]

  const n = TRENDS_DATA.length
  const groupW = cW / n
  const barW = groupW * 0.19
  const barGap = groupW * 0.02

  const xGroup = (i: number) => P.l + i * groupW + groupW * 0.12
  const yAt = (v: number) => P.t + (1 - v / MAX_Y) * cH
  const bh = (v: number) => (v / MAX_Y) * cH

  return (
    <div style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* grid */}
        {Y_TICKS.map((v) => (
          <g key={v}>
            <line x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={P.l - 4} y={yAt(v)} fontSize={9} textAnchor="end" dominantBaseline="middle" fill="#9ca3af">
              {fmtAxis(v)}
            </text>
          </g>
        ))}

        {TRENDS_DATA.map((d, i) => {
          const gx = xGroup(i)
          return (
            <g key={i}>
              <rect x={gx}                        y={yAt(d.income)}  width={barW} height={bh(d.income)}  fill="#4ade80" rx={2} />
              <rect x={gx + barW + barGap}        y={yAt(d.expense)} width={barW} height={bh(d.expense)} fill="#f87171" rx={2} />
              <rect x={gx + 2 * (barW + barGap)}  y={yAt(d.balance)} width={barW} height={bh(d.balance)} fill="#60a5fa" rx={2} />
              <text x={gx + barW + barGap} y={H - 4} fontSize={10} textAnchor="middle" fill="#9ca3af">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Forecast KPI card ────────────────────────────────────────────────────────

function ForecastCard({
  icon,
  iconBg,
  pill,
  pillStyle,
  value,
  subtitle,
  note,
  noteColor,
  cardStyle,
}: {
  icon: React.ReactNode
  iconBg: string
  pill: string
  pillStyle: string
  value: string
  subtitle: string
  note: string
  noteColor: string
  cardStyle: string
}) {
  return (
    <div className={`flex-1 rounded-lg border p-5 flex flex-col gap-3 ${cardStyle}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${pillStyle}`}>
          {pill}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1.5">{subtitle}</p>
      </div>
      <p className={`text-xs font-semibold ${noteColor}`}>{note}</p>
    </div>
  )
}

// ─── Anomaly item ─────────────────────────────────────────────────────────────

function AnomalyItem({
  title,
  description,
  date,
  amount,
  scheme,
}: {
  title: string
  description: string
  date: string
  amount: string
  scheme: 'red' | 'amber' | 'orange'
}) {
  const s = {
    red:    { wrap: 'bg-red-50    border-red-100',    title: 'text-red-700',    meta: 'text-red-400',    badge: 'bg-red-100    text-red-700'    },
    amber:  { wrap: 'bg-amber-50  border-amber-100',  title: 'text-amber-700',  meta: 'text-amber-400',  badge: 'bg-amber-100  text-amber-700'  },
    orange: { wrap: 'bg-orange-50 border-orange-100', title: 'text-orange-700', meta: 'text-orange-400', badge: 'bg-orange-100 text-orange-700' },
  }[scheme]

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-4 ${s.wrap}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold mb-1 ${s.title}`}>{title}</p>
        <p className="text-xs text-gray-600 mb-2 leading-relaxed">{description}</p>
        <div className={`flex items-center gap-1 text-xs ${s.meta}`}>
          <Calendar size={11} />
          <span>{date}</span>
        </div>
      </div>
      <span className={`text-sm font-bold px-3 py-1 rounded-lg shrink-0 ${s.badge}`}>
        {amount}
      </span>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AIAnalyticsPage() {
  const [period, setPeriod] = useState('Последние 6 месяцев')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
            >
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                AI Аналитика и Прогнозирование
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Умные прогнозы и анализ данных с помощью искусственного интеллекта
              </p>
            </div>
          </div>

          {/* period filter */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs font-medium text-gray-600">Период</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="
                px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                bg-gray-50 text-gray-700
                focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300
                transition-colors
              "
            >
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* ── forecast KPI cards ───────────────────────────────────────── */}
        <div className="flex gap-4">
          <ForecastCard
            icon={<Wallet size={20} className="text-blue-600" />}
            iconBg="bg-blue-100"
            pill="Прогноз"
            pillStyle="bg-blue-100 text-blue-700"
            value="470 000 ₸"
            subtitle="Ожидаемый баланс на конец месяца"
            note="↑ +15% к прошлому месяцу"
            noteColor="text-green-600"
            cardStyle="bg-blue-50 border-blue-100"
          />
          <ForecastCard
            icon={<TrendingUp size={20} className="text-purple-600" />}
            iconBg="bg-purple-100"
            pill="Доход"
            pillStyle="bg-purple-100 text-purple-700"
            value="1 320 000 ₸"
            subtitle="Прогноз доходов на следующий месяц"
            note="Высокая точность (92%)"
            noteColor="text-purple-600"
            cardStyle="bg-purple-50 border-purple-100"
          />
          <ForecastCard
            icon={<TrendingDown size={20} className="text-orange-600" />}
            iconBg="bg-orange-100"
            pill="Расход"
            pillStyle="bg-orange-100 text-orange-700"
            value="910 000 ₸"
            subtitle="Прогноз расходов на следующий месяц"
            note="↓ -3% к среднему"
            noteColor="text-green-600"
            cardStyle="bg-orange-50 border-orange-100"
          />
        </div>

        {/* ── forecast charts row ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* expense forecast */}
          <SectionCard title="Прогноз расходов">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-1.5 text-xs text-gray-400">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>Рост связан с сезонностью и увеличением коммунальных платежей</span>
              </div>
              <ForecastAreaChart
                data={EXPENSE_FORECAST}
                actualColor="#3b82f6"
                minY={700}
                maxY={950}
                tickStep={50}
              />
              <Legend items={[
                { color: '#3b82f6', label: 'Фактические' },
                { color: '#8b5cf6', dash: true, label: 'Прогноз' },
              ]} />
            </div>
          </SectionCard>

          {/* income forecast */}
          <SectionCard title="Прогноз доходов">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-1.5 text-xs text-gray-400">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>Ожидается рост за счет увеличения числа учащихся</span>
              </div>
              <ForecastAreaChart
                data={INCOME_FORECAST}
                actualColor="#22c55e"
                minY={1000}
                maxY={1350}
                tickStep={100}
              />
              <Legend items={[
                { color: '#22c55e', label: 'Фактические' },
                { color: '#8b5cf6', dash: true, label: 'Прогноз' },
              ]} />
            </div>
          </SectionCard>

        </div>

        {/* ── full-width monthly trends chart ─────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-3.5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Тренды по месяцам</h2>
            <p className="text-xs text-gray-400 mt-0.5">Сравнение доходов, расходов и баланса</p>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <MonthlyTrendsChart />
            <Legend items={[
              { color: '#4ade80', label: 'Доходы' },
              { color: '#f87171', label: 'Расходы' },
              { color: '#60a5fa', label: 'Баланс' },
            ]} />
          </div>
        </div>

        {/* ── anomalies card ───────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">

          {/* section header */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Обнаруженные аномалии</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              AI выявил необычные паттерны в ваших данных
            </p>
          </div>

          {/* anomaly items */}
          <div className="flex flex-col gap-3">
            <AnomalyItem
              scheme="red"
              title="Резкий рост коммунальных расходов"
              description="На 35% выше среднего за последние 3 месяца"
              date="15 марта 2026"
              amount="+127 000 ₸"
            />
            <AnomalyItem
              scheme="amber"
              title="Снижение поступлений от родителей"
              description="Снижение на 12% по сравнению с предыдущим месяцем"
              date="10 марта 2026"
              amount="−164 000 ₸"
            />
            <AnomalyItem
              scheme="orange"
              title="Необычная операция"
              description="Крупная оплата поставщику без предварительного договора"
              date="12 марта 2026"
              amount="450 000 ₸"
            />
          </div>

          {/* AI advice */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <Lightbulb size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">AI Совет:</span>{' '}
              Рекомендуем проверить коммунальные расходы и создать резерв на следующий месяц
              для стабилизации баланса.
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}
