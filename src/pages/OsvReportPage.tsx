import { useState, useEffect, useCallback } from 'react'
import { Printer, Download, Info } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import { getTrialBalance, type TrialBalanceRow, type TrialBalanceTotals } from '../api/osvReport'

// ─── period presets ───────────────────────────────────────────────────────────

interface PeriodPreset {
  label: string
  from: string
  to: string
}

const PERIODS: PeriodPreset[] = [
  { label: 'Март 2026',      from: '2026-03-01', to: '2026-03-31' },
  { label: 'Февраль 2026',   from: '2026-02-01', to: '2026-02-28' },
  { label: 'Январь 2026',    from: '2026-01-01', to: '2026-01-31' },
  { label: 'I квартал 2026', from: '2026-01-01', to: '2026-03-31' },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toLocaleString('ru-RU')
}

function exportToCsv(rows: TrialBalanceRow[], totals: TrialBalanceTotals | null, dateFrom: string, dateTo: string) {
  const header = [
    'Счет', 'Название счета',
    'Нач. остаток Дебет', 'Нач. остаток Кредит',
    'Обороты Дебет', 'Обороты Кредит',
    'Кон. остаток Дебет', 'Кон. остаток Кредит',
  ]

  const toCell = (v: number | null) => (v === null ? '' : String(v))

  const dataRows = rows.map((r) => [
    r.code, r.name,
    toCell(r.openD), toCell(r.openC),
    toCell(r.turnD), toCell(r.turnC),
    toCell(r.closeD), toCell(r.closeC),
  ])

  if (totals) {
    dataRows.push([
      'ИТОГО', '',
      toCell(totals.openD), toCell(totals.openC),
      toCell(totals.turnD), toCell(totals.turnC),
      toCell(totals.closeD), toCell(totals.closeC),
    ])
  }

  const csv = [header, ...dataRows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `osv_${dateFrom}_${dateTo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── shared class strings ─────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

const thGroupCls =
  'text-center text-xs font-semibold text-gray-400 tracking-wider uppercase ' +
  'px-4 py-2.5 bg-gray-50 border-b border-gray-100'

const thSubCls =
  'text-right text-xs font-semibold text-gray-400 tracking-wider uppercase ' +
  'px-4 py-2 bg-gray-50 border-b border-gray-200'

const tdNumCls = 'px-4 py-3.5 text-right tabular-nums text-sm text-gray-600'
const tdNumCloseCls = 'px-4 py-3.5 text-right tabular-nums text-sm font-medium text-gray-700'
const tdTotalCls = 'px-4 py-3 text-right tabular-nums text-sm font-semibold text-gray-800 bg-gray-50'

// ─── table ────────────────────────────────────────────────────────────────────

function OsvTable({
  rows,
  totals,
  loading,
  error,
  onRetry,
}: {
  rows: TrialBalanceRow[]
  totals: TrialBalanceTotals | null
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
        <span className="text-sm text-gray-400">Загрузка отчёта...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-sm text-red-500">{error}</span>
        <button
          onClick={onRetry}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Повторить
        </button>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
        <span className="text-sm text-gray-400">Нет данных за выбранный период</span>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          {/* ── row 1: group labels ─────────────────────────────────────── */}
          <tr>
            <th
              rowSpan={2}
              className="
                text-left text-xs font-semibold text-gray-400 tracking-wider uppercase
                px-5 py-3 w-20 bg-gray-50
                border-b border-gray-200 border-r border-gray-200
                align-bottom
              "
            >
              Счет
            </th>
            <th
              rowSpan={2}
              className="
                text-left text-xs font-semibold text-gray-400 tracking-wider uppercase
                px-4 py-3 bg-gray-50
                border-b border-gray-200 border-r border-gray-200
                align-bottom
              "
            >
              Название счета
            </th>
            <th colSpan={2} className={`${thGroupCls} border-r border-gray-200`}>
              Начальный остаток
            </th>
            <th colSpan={2} className={`${thGroupCls} border-r border-gray-200`}>
              Обороты
            </th>
            <th colSpan={2} className={thGroupCls}>
              Конечный остаток
            </th>
          </tr>

          {/* ── row 2: sub-headers ──────────────────────────────────────── */}
          <tr>
            <th className={thSubCls}>Дебет</th>
            <th className={`${thSubCls} border-r border-gray-200`}>Кредит</th>
            <th className={thSubCls}>Дебет</th>
            <th className={`${thSubCls} border-r border-gray-200`}>Кредит</th>
            <th className={thSubCls}>Дебет</th>
            <th className={thSubCls}>Кредит</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.code}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="px-5 py-3.5 border-r border-gray-100">
                <span className="font-mono text-sm font-medium text-gray-700">
                  {row.code}
                </span>
              </td>
              <td className="px-4 py-3.5 text-gray-700 border-r border-gray-100">
                {row.name}
              </td>
              <td className={tdNumCls}>{fmt(row.openD)}</td>
              <td className={`${tdNumCls} border-r border-gray-100`}>{fmt(row.openC)}</td>
              <td className={tdNumCls}>{fmt(row.turnD)}</td>
              <td className={`${tdNumCls} border-r border-gray-100`}>{fmt(row.turnC)}</td>
              <td className={tdNumCloseCls}>{fmt(row.closeD)}</td>
              <td className={tdNumCloseCls}>{fmt(row.closeC)}</td>
            </tr>
          ))}

          {/* totals row — only if backend returned them */}
          {totals && (
            <tr className="border-t border-gray-200">
              <td className="px-5 py-3 font-semibold text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-100">
                Итого
              </td>
              <td className="px-4 py-3 bg-gray-50 border-r border-gray-100" />
              <td className={tdTotalCls}>{fmt(totals.openD)}</td>
              <td className={`${tdTotalCls} border-r border-gray-100`}>{fmt(totals.openC)}</td>
              <td className={tdTotalCls}>{fmt(totals.turnD)}</td>
              <td className={`${tdTotalCls} border-r border-gray-100`}>{fmt(totals.turnC)}</td>
              <td className={tdTotalCls}>{fmt(totals.closeD)}</td>
              <td className={tdTotalCls}>{fmt(totals.closeC)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OsvReportPage() {
  const [period, setPeriod]     = useState(PERIODS[0].label)
  const [dateFrom, setDateFrom] = useState(PERIODS[0].from)
  const [dateTo, setDateTo]     = useState(PERIODS[0].to)

  const [rows, setRows]       = useState<TrialBalanceRow[]>([])
  const [totals, setTotals]   = useState<TrialBalanceTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // ─── load ────────────────────────────────────────────────────────────────

  const load = useCallback((from: string, to: string) => {
    if (!from || !to) return
    setLoading(true)
    setError(null)
    getTrialBalance(from, to)
      .then((report) => {
        setRows(report.rows)
        setTotals(report.totals)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки отчёта')
      })
      .finally(() => setLoading(false))
  }, [])

  // reload when dates change
  useEffect(() => {
    load(dateFrom, dateTo)
  }, [dateFrom, dateTo, load])

  // ─── period preset handler ────────────────────────────────────────────────

  const handlePeriodChange = (label: string) => {
    setPeriod(label)
    const preset = PERIODS.find((p) => p.label === label)
    if (preset) {
      setDateFrom(preset.from)
      setDateTo(preset.to)
      // useEffect on dateFrom/dateTo will trigger reload
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────────── */}
        <PageHeaderWithAction
          title="Оборотно-сальдовая ведомость (ОСВ)"
          subtitle="Критический отчет для бухгалтерского учета"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Printer size={15} />
                Печать
              </button>
              <button
                type="button"
                disabled={rows.length === 0 || loading}
                onClick={() => exportToCsv(rows, totals, dateFrom, dateTo)}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={15} />
                Экспорт
              </button>
            </div>
          }
        />

        {/* ── filter card ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <div className="flex gap-4">

            <div className="w-48 shrink-0 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Период</label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className={inputCls}
              >
                {PERIODS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Дата начала</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Дата окончания</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputCls}
              />
            </div>

          </div>
        </div>

        {/* ── report table ────────────────────────────────────────────── */}
        <OsvTable
          rows={rows}
          totals={totals}
          loading={loading}
          error={error}
          onRetry={() => load(dateFrom, dateTo)}
        />

        {/* ── bottom note ─────────────────────────────────────────────── */}
        <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Важно:</span>{' '}
            ОСВ является основным отчетом для контроля правильности ведения бухучета. Сумма
            дебетовых оборотов должна равняться сумме кредитовых оборотов.
          </p>
        </div>

      </div>
    </div>
  )
}
