import { useState } from 'react'
import { Printer, Download, Info } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'

// ─── data ─────────────────────────────────────────────────────────────────────

interface AccountRow {
  code: string
  name: string
  openD: number | null
  openC: number | null
  turnD: number | null
  turnC: number | null
  closeD: number | null
  closeC: number | null
}

const DATA: AccountRow[] = [
  { code: '1010', name: 'Денежные средства в кассе',                     openD: 400_000,    openC: null,  turnD: 250_000,   turnC: 200_000,  closeD: 450_000,    closeC: null },
  { code: '1030', name: 'Денежные средства на счетах в банках',           openD: 14_000_000, openC: null,  turnD: 3_500_000, turnC: 2_500_000, closeD: 15_000_000, closeC: null },
  { code: '1210', name: 'Дебиторская задолженность покупателей',          openD: 2_000_000,  openC: null,  turnD: 500_000,   turnC: 200_000,  closeD: 2_300_000,  closeC: null },
  { code: '1310', name: 'Сырье и материалы',                              openD: 500_000,    openC: null,  turnD: 150_000,   turnC: 90_000,   closeD: 560_000,    closeC: null },
  { code: '2410', name: 'Кредиторская задолженность поставщикам',         openD: 1_000_000,  openC: null,  turnD: 100_000,   turnC: 300_000,  closeD: 1_200_000,  closeC: null },
  { code: '6010', name: 'Доход от реализации продукции',                  openD: 7_500_000,  openC: null,  turnD: null,      turnC: 1_000_000, closeD: 8_500_000, closeC: null },
  { code: '7110', name: 'Расходы по заработной плате',                    openD: 3_500_000,  openC: null,  turnD: 600_000,   turnC: null,     closeD: 4_100_000,  closeC: null },
  { code: '7210', name: 'Расходы на аренду',                              openD: 700_000,    openC: null,  turnD: 150_000,   turnC: null,     closeD: 850_000,    closeC: null },
  { code: '7310', name: 'Коммунальные расходы',                           openD: 250_000,    openC: null,  turnD: 70_000,    turnC: null,     closeD: 320_000,    closeC: null },
]

const PERIODS = ['Март 2026', 'Февраль 2026', 'Январь 2026', 'I квартал 2026']

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Format a number using Russian locale (space thousands separator), dash for null/zero */
function fmt(v: number | null): string {
  if (v === null || v === 0) return '—'
  return v.toLocaleString('ru-RU')
}

// ─── shared class strings ─────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

// header cell — group label row
const thGroupCls =
  'text-center text-xs font-semibold text-gray-400 tracking-wider uppercase ' +
  'px-4 py-2.5 bg-gray-50 border-b border-gray-100'

// header cell — sub-header row
const thSubCls =
  'text-right text-xs font-semibold text-gray-400 tracking-wider uppercase ' +
  'px-4 py-2 bg-gray-50 border-b border-gray-200'

// body cell — numeric
const tdNumCls = 'px-4 py-3.5 text-right tabular-nums text-sm text-gray-600'

// body cell — numeric, closing balance (slightly bolder)
const tdNumCloseCls = 'px-4 py-3.5 text-right tabular-nums text-sm font-medium text-gray-700'

// ─── table ────────────────────────────────────────────────────────────────────

function OsvTable() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          {/* ── row 1: group labels ─────────────────────────────────────── */}
          <tr>
            {/* СЧЕТ — spans both header rows */}
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

            {/* НАЗВАНИЕ СЧЕТА — spans both header rows */}
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

          {/* ── row 2: column sub-headers ───────────────────────────────── */}
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
          {DATA.map((row) => (
            <tr
              key={row.code}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              {/* Account code */}
              <td className="px-5 py-3.5 border-r border-gray-100">
                <span className="font-mono text-sm font-medium text-gray-700">
                  {row.code}
                </span>
              </td>

              {/* Account name */}
              <td className="px-4 py-3.5 text-gray-700 border-r border-gray-100">
                {row.name}
              </td>

              {/* Opening balance */}
              <td className={tdNumCls}>{fmt(row.openD)}</td>
              <td className={`${tdNumCls} border-r border-gray-100`}>{fmt(row.openC)}</td>

              {/* Turnovers */}
              <td className={tdNumCls}>{fmt(row.turnD)}</td>
              <td className={`${tdNumCls} border-r border-gray-100`}>{fmt(row.turnC)}</td>

              {/* Closing balance — bolder */}
              <td className={tdNumCloseCls}>{fmt(row.closeD)}</td>
              <td className={tdNumCloseCls}>{fmt(row.closeC)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OsvReportPage() {
  const [period, setPeriod]    = useState('Март 2026')
  const [dateFrom, setDateFrom] = useState('2026-03-01')
  const [dateTo, setDateTo]     = useState('2026-03-31')

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
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Printer size={15} />
                Печать
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
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
                onChange={(e) => setPeriod(e.target.value)}
                className={inputCls}
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
        <OsvTable />

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
