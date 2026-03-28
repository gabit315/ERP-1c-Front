import { useState, useEffect, useCallback } from 'react'
import { Download, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import KPIStatCard from '../components/ui/KPIStatCard'
import SectionCard from '../components/ui/SectionCard'
import { getGeneralSummary, type GeneralSummary } from '../api/generalSummary'

// ─── period presets ───────────────────────────────────────────────────────────

interface PeriodPreset {
  label: string
  from: string
  to: string
}

const PERIODS: PeriodPreset[] = [
  { label: 'I квартал 2026', from: '2026-01-01', to: '2026-03-31' },
  { label: 'Март 2026',      from: '2026-03-01', to: '2026-03-31' },
  { label: 'Февраль 2026',   from: '2026-02-01', to: '2026-02-28' },
  { label: 'Январь 2026',    from: '2026-01-01', to: '2026-01-31' },
  { label: 'Весь год',       from: '2026-01-01', to: '2026-12-31' },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return v.toLocaleString('ru-RU')
}

function fmtMoney(v: number): string {
  return fmt(v) + ' ₸'
}

function exportToCsv(data: GeneralSummary) {
  const lines: string[][] = []

  lines.push(['Период', `${data.dateFrom} — ${data.dateTo}`])
  lines.push([])
  lines.push(['Раздел', 'Показатель', 'Сумма'])
  lines.push(['Итоги', 'Доходы',       String(data.totals.income)])
  lines.push(['Итоги', 'Расходы',      String(data.totals.expenses)])
  lines.push(['Итоги', 'Чистая прибыль', String(data.totals.netProfit)])
  lines.push(['Итоги', 'Остаток денег', String(data.totals.cashBalance)])
  lines.push([])
  lines.push(['Месяц', 'Доходы', 'Расходы', 'Прибыль'])
  data.monthly.forEach((m) =>
    lines.push([m.month, String(m.income), String(m.expense), String(m.profit)])
  )
  lines.push([])
  lines.push(['Статья расходов', 'Сумма', '%'])
  data.expenseStructure.forEach((e) =>
    lines.push([e.label, String(e.amount), String(e.pct)])
  )

  const csv = lines
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `general_summary_${data.dateFrom}_${data.dateTo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function MonthBlock({ name, income, expense, profit, barMax }: {
  name: string
  income: number
  expense: number
  profit: number
  barMax: number
}) {
  const incPct = barMax > 0 ? Math.round((income  / barMax) * 100) : 0
  const expPct = barMax > 0 ? Math.round((expense / barMax) * 100) : 0

  return (
    <div className="py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {profit >= 0 ? '+' : '−'}{fmtMoney(Math.abs(profit))}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-gray-400 w-14 shrink-0">Доходы</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full" style={{ width: `${incPct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-gray-600 w-28 text-right shrink-0">
          {fmtMoney(income)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14 shrink-0">Расходы</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-red-300 rounded-full" style={{ width: `${expPct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-gray-600 w-28 text-right shrink-0">
          {fmtMoney(expense)}
        </span>
      </div>
    </div>
  )
}

function ExpenseRow({ label, amount, pct }: { label: string; amount: number; pct: number }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm tabular-nums font-medium text-gray-700">
            {fmtMoney(amount)}
          </span>
          <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function GeneralSummaryPage() {
  const [period, setPeriod] = useState(PERIODS[0].label)
  const [dateFrom, setDateFrom] = useState(PERIODS[0].from)
  const [dateTo, setDateTo]     = useState(PERIODS[0].to)

  const [data, setData]       = useState<GeneralSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // ─── load ────────────────────────────────────────────────────────────────

  const load = useCallback((from: string, to: string) => {
    setLoading(true)
    setError(null)
    getGeneralSummary(from, to)
      .then(setData)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки сводки')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(dateFrom, dateTo)
  }, [dateFrom, dateTo, load])

  // ─── period change ────────────────────────────────────────────────────────

  const handlePeriodChange = (label: string) => {
    setPeriod(label)
    const preset = PERIODS.find((p) => p.label === label)
    if (preset) {
      setDateFrom(preset.from)
      setDateTo(preset.to)
    }
  }

  // ─── derived ──────────────────────────────────────────────────────────────

  const totals = data?.totals
  const monthly = data?.monthly ?? []
  const barMax = monthly.length > 0
    ? Math.max(...monthly.map((m) => Math.max(m.income, m.expense)))
    : 1

  const rentability = totals && totals.income > 0
    ? Math.round((totals.netProfit / totals.income) * 100)
    : null

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────────── */}
        <PageHeaderWithAction
          title="Общая сводка"
          subtitle="Общий финансовый обзор за период"
          action={
            <button
              type="button"
              disabled={!data || loading}
              onClick={() => data && exportToCsv(data)}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={15} />
              Экспорт
            </button>
          }
        />

        {/* ── filter card ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <div className="flex items-end gap-4">
            <div className="w-56 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Период</label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="
                  w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                  bg-gray-50 text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300
                  transition-colors
                "
              >
                {PERIODS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-600">{error}</span>
            <button
              onClick={() => load(dateFrom, dateTo)}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline ml-4 shrink-0"
            >
              Повторить
            </button>
          </div>
        )}

        {/* ── KPI cards ───────────────────────────────────────────────── */}
        <div className="flex gap-4">
          <KPIStatCard
            title="Общие доходы"
            value={loading ? '...' : totals ? fmtMoney(totals.income) : '—'}
            icon={<TrendingUp size={18} className="text-green-600" />}
            iconBg="bg-green-50"
          />
          <KPIStatCard
            title="Общие расходы"
            value={loading ? '...' : totals ? fmtMoney(totals.expenses) : '—'}
            subtitle={totals ? fmt(totals.expenses) + ' за период' : undefined}
            icon={<TrendingDown size={18} className="text-red-500" />}
            iconBg="bg-red-50"
          />
          <KPIStatCard
            title="Чистая прибыль"
            value={loading ? '...' : totals ? fmtMoney(totals.netProfit) : '—'}
            subtitle={rentability !== null ? `${rentability}% рентабельность` : undefined}
            icon={<DollarSign size={18} className="text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <KPIStatCard
            title="Остаток денег"
            value={loading ? '...' : totals ? fmtMoney(totals.cashBalance) : '—'}
            subtitle="На счетах и в кассе"
            icon={<Wallet size={18} className="text-purple-600" />}
            iconBg="bg-purple-50"
          />
        </div>

        {/* loading / empty for lower sections */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
            <span className="text-sm text-gray-400">Загрузка сводки...</span>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-2 gap-4">

            {/* left: monthly income vs expense */}
            <SectionCard title="Доходы и расходы по месяцам">
              <div className="flex flex-col">
                {monthly.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Нет данных за период</p>
                ) : (
                  monthly.map((m) => (
                    <MonthBlock
                      key={m.month}
                      name={m.month}
                      income={m.income}
                      expense={m.expense}
                      profit={m.profit}
                      barMax={barMax}
                    />
                  ))
                )}
              </div>
            </SectionCard>

            {/* right: expense structure */}
            <SectionCard title="Структура расходов">
              <div className="flex flex-col">
                {data.expenseStructure.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Нет данных за период</p>
                ) : (
                  <>
                    {data.expenseStructure.map((e) => (
                      <ExpenseRow
                        key={e.label}
                        label={e.label}
                        amount={e.amount}
                        pct={e.pct}
                      />
                    ))}

                    {/* total row */}
                    <div className="flex items-center justify-between pt-3.5 mt-1 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Итого</span>
                      <span className="text-sm font-semibold text-gray-800 tabular-nums">
                        {fmtMoney(data.expenseTotal)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>

          </div>
        )}

      </div>
    </div>
  )
}
