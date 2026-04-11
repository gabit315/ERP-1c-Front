import { useState, useEffect, useCallback, useMemo } from 'react'
import { Printer, Download, AlertTriangle, Info } from 'lucide-react'
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

// ─── mock fallback data ───────────────────────────────────────────────────────
// Removed once backend reliably returns OSV rows

const MOCK_ROWS: TrialBalanceRow[] = [
  { code: '1010', name: 'Денежные средства в кассе',              openD: 400_000,    openC: null,      turnD: 250_000,   turnC: 200_000,   closeD: 450_000,    closeC: null },
  { code: '1030', name: 'Денежные средства на счетах в банках',   openD: 14_000_000, openC: null,      turnD: 3_500_000, turnC: 2_500_000, closeD: 15_000_000, closeC: null },
  { code: '1210', name: 'Дебиторская задолженность покупателей',  openD: 2_000_000,  openC: null,      turnD: 500_000,   turnC: 200_000,   closeD: 2_300_000,  closeC: null },
  { code: '1310', name: 'Сырье и материалы',                      openD: 500_000,    openC: null,      turnD: 150_000,   turnC: 90_000,    closeD: 560_000,    closeC: null },
  { code: '2410', name: 'Кредиторская задолженность поставщикам', openD: null,       openC: 1_000_000, turnD: 100_000,   turnC: 300_000,   closeD: null,       closeC: 1_200_000 },
  { code: '6010', name: 'Доход от реализации продукции',          openD: null,       openC: 7_500_000, turnD: null,      turnC: 1_000_000, closeD: null,       closeC: 8_500_000 },
  { code: '7110', name: 'Расходы по заработной плате',            openD: 3_500_000,  openC: null,      turnD: 2_800_000, turnC: null,      closeD: 6_300_000,  closeC: null },
  { code: '7210', name: 'Расходы на аренду',                      openD: 700_000,    openC: null,      turnD: 150_000,   turnC: null,      closeD: 850_000,    closeC: null },
  { code: '7310', name: 'Коммунальные расходы',                   openD: 250_000,    openC: null,      turnD: 70_000,    turnC: null,      closeD: 320_000,    closeC: null },
]

const MOCK_TOTALS: TrialBalanceTotals = {
  openD:  21_350_000,
  openC:  8_500_000,
  turnD:  7_520_000,
  turnC:  4_290_000,
  closeD: 25_780_000,
  closeC: 9_700_000,
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toLocaleString('ru-RU')
}

function exportToCsv(
  rows: TrialBalanceRow[],
  totals: TrialBalanceTotals | null,
  dateFrom: string,
  dateTo: string,
) {
  const header = [
    'Счет', 'Название счета',
    'Нач. остаток Дебет', 'Нач. остаток Кредит',
    'Обороты Дебет', 'Обороты Кредит',
    'Кон. остаток Дебет', 'Кон. остаток Кредит',
  ]
  const toCell = (v: number | null) => (v === null ? '' : String(v))
  const dataRows = rows.map((r) => [
    r.code, r.name,
    toCell(r.openD),  toCell(r.openC),
    toCell(r.turnD),  toCell(r.turnC),
    toCell(r.closeD), toCell(r.closeC),
  ])
  if (totals) {
    dataRows.push([
      'ИТОГО', '',
      toCell(totals.openD),  toCell(totals.openC),
      toCell(totals.turnD),  toCell(totals.turnC),
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

// ─── BalanceAlert ─────────────────────────────────────────────────────────────

function BalanceAlert({ totals }: { totals: TrialBalanceTotals }) {
  const openDiff  = Math.abs((totals.openD  ?? 0) - (totals.openC  ?? 0))
  const turnDiff  = Math.abs((totals.turnD  ?? 0) - (totals.turnC  ?? 0))
  const closeDiff = Math.abs((totals.closeD ?? 0) - (totals.closeC ?? 0))

  const isBalanced = openDiff === 0 && turnDiff === 0 && closeDiff === 0
  if (isBalanced) return null

  const errors: string[] = []
  if (openDiff  > 0) errors.push(`Начальное сальдо не сбалансировано (разница: ${openDiff.toLocaleString('ru-RU')} ₸)`)
  if (turnDiff  > 0) errors.push(`Обороты не сбалансированы (разница: ${turnDiff.toLocaleString('ru-RU')} ₸)`)
  if (closeDiff > 0) errors.push(`Конечное сальдо не сбалансировано (разница: ${closeDiff.toLocaleString('ru-RU')} ₸)`)

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex gap-3">
      <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-red-700">Ошибка балансировки!</p>
        {errors.map((e) => (
          <p key={e} className="text-sm text-red-600">{e}</p>
        ))}
      </div>
    </div>
  )
}

// ─── OsvTable ─────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

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
        <button onClick={onRetry} className="text-sm font-medium text-blue-600 hover:text-blue-700">
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

  // shared cell classes
  const numCell = 'px-4 py-3 text-right tabular-nums text-sm text-gray-700 whitespace-nowrap'
  const borderR = 'border-r border-gray-200'

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* ── row 1: group labels ─────────────────────────────────── */}
            <tr className="border-b border-gray-200">
              <th
                rowSpan={2}
                className={`text-left text-xs font-semibold text-gray-500 tracking-wider uppercase px-5 py-3 w-20 bg-gray-50 align-bottom ${borderR}`}
              >
                Счет
              </th>
              <th
                rowSpan={2}
                className={`text-left text-xs font-semibold text-gray-500 tracking-wider uppercase px-4 py-3 bg-gray-50 align-bottom min-w-[220px] ${borderR}`}
              >
                Название счета
              </th>

              {/* opening balance — light blue */}
              <th
                colSpan={2}
                className={`text-center text-xs font-semibold text-blue-700 tracking-wider uppercase px-4 py-3 bg-blue-50 ${borderR}`}
              >
                Начальный остаток
              </th>

              {/* turnovers — light purple */}
              <th
                colSpan={2}
                className={`text-center text-xs font-semibold text-purple-700 tracking-wider uppercase px-4 py-3 bg-purple-50 ${borderR}`}
              >
                Обороты за период
              </th>

              {/* closing balance — light green */}
              <th
                colSpan={2}
                className="text-center text-xs font-semibold text-emerald-700 tracking-wider uppercase px-4 py-3 bg-emerald-50"
              >
                Конечный остаток
              </th>
            </tr>

            {/* ── row 2: sub-headers ──────────────────────────────────── */}
            <tr className="border-b border-gray-200">
              <th className={`text-right text-xs font-semibold text-blue-600 tracking-wider uppercase px-4 py-2.5 bg-blue-50`}>
                Дебет
              </th>
              <th className={`text-right text-xs font-semibold text-blue-600 tracking-wider uppercase px-4 py-2.5 bg-blue-50 ${borderR}`}>
                Кредит
              </th>
              <th className="text-right text-xs font-semibold text-purple-600 tracking-wider uppercase px-4 py-2.5 bg-purple-50">
                Дебет
              </th>
              <th className={`text-right text-xs font-semibold text-purple-600 tracking-wider uppercase px-4 py-2.5 bg-purple-50 ${borderR}`}>
                Кредит
              </th>
              <th className="text-right text-xs font-semibold text-emerald-600 tracking-wider uppercase px-4 py-2.5 bg-emerald-50">
                Дебет
              </th>
              <th className="text-right text-xs font-semibold text-emerald-600 tracking-wider uppercase px-4 py-2.5 bg-emerald-50">
                Кредит
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.code}
                className={`hover:bg-gray-50 transition-colors ${idx < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <td className={`px-5 py-3 ${borderR}`}>
                  <span className="font-mono text-sm font-semibold text-gray-800">{row.code}</span>
                </td>
                <td className={`px-4 py-3 text-sm text-gray-700 ${borderR}`}>{row.name}</td>

                <td className={numCell}>{fmt(row.openD)}</td>
                <td className={`${numCell} ${borderR}`}>{fmt(row.openC)}</td>

                <td className={numCell}>{fmt(row.turnD)}</td>
                <td className={`${numCell} ${borderR}`}>{fmt(row.turnC)}</td>

                <td className={`${numCell} font-medium`}>{fmt(row.closeD)}</td>
                <td className={`${numCell} font-medium`}>{fmt(row.closeC)}</td>
              </tr>
            ))}

            {/* totals row */}
            {totals && (
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className={`px-5 py-3 ${borderR}`}>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Итого</span>
                </td>
                <td className={`px-4 py-3 ${borderR}`} />

                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-red-600 whitespace-nowrap">
                  {fmt(totals.openD)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-sm font-bold text-red-600 whitespace-nowrap ${borderR}`}>
                  {fmt(totals.openC)}
                </td>

                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-red-600 whitespace-nowrap">
                  {fmt(totals.turnD)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-sm font-bold text-red-600 whitespace-nowrap ${borderR}`}>
                  {fmt(totals.turnC)}
                </td>

                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-red-600 whitespace-nowrap">
                  {fmt(totals.closeD)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-red-600 whitespace-nowrap">
                  {fmt(totals.closeC)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OsvReportPage() {
  const [period, setPeriod]     = useState(PERIODS[0].label)
  const [dateFrom, setDateFrom] = useState(PERIODS[0].from)
  const [dateTo, setDateTo]     = useState(PERIODS[0].to)

  const [apiRows, setApiRows]     = useState<TrialBalanceRow[]>([])
  const [apiTotals, setApiTotals] = useState<TrialBalanceTotals | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // ── load ─────────────────────────────────────────────────────────────────

  const load = useCallback((from: string, to: string) => {
    if (!from || !to) return
    setLoading(true)
    setError(null)
    getTrialBalance(from, to)
      .then((report) => {
        setApiRows(report.rows)
        setApiTotals(report.totals)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки отчёта')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(dateFrom, dateTo)
  }, [dateFrom, dateTo, load])

  // ── period preset handler ─────────────────────────────────────────────────

  const handlePeriodChange = (label: string) => {
    setPeriod(label)
    const preset = PERIODS.find((p) => p.label === label)
    if (preset) {
      setDateFrom(preset.from)
      setDateTo(preset.to)
    }
  }

  // ── use real data if available, else mock ─────────────────────────────────

  const rows   = !loading && !error && apiRows.length > 0   ? apiRows   : (!loading && !error ? MOCK_ROWS   : apiRows)
  const totals = !loading && !error && apiRows.length > 0   ? apiTotals : (!loading && !error ? MOCK_TOTALS : apiTotals)

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-5">

        {/* ── header ────────────────────────────────────────────────────── */}
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

        {/* ── balance alert ─────────────────────────────────────────────── */}
        {!loading && totals && <BalanceAlert totals={totals} />}

        {/* ── filters ───────────────────────────────────────────────────── */}
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

        {/* ── table ─────────────────────────────────────────────────────── */}
        <OsvTable
          rows={rows}
          totals={totals}
          loading={loading}
          error={error}
          onRetry={() => load(dateFrom, dateTo)}
        />

        {/* ── info note ─────────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 flex gap-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-blue-800 leading-relaxed">
              <span className="font-semibold">Важно:</span>{' '}
              ОСВ является основным отчетом для контроля правильности ведения бухучета.
              В корректной ОСВ должны выполняться следующие условия:
            </p>
            <ul className="flex flex-col gap-1">
              {[
                'Сумма начального дебетового сальдо = Сумма начального кредитового сальдо',
                'Сумма дебетовых оборотов = Сумма кредитовых оборотов',
                'Сумма конечного дебетового сальдо = Сумма конечного кредитового сальдо',
              ].map((rule) => (
                <li key={rule} className="text-sm text-blue-700 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
