import { useState } from 'react'
import { Download } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'

// ─── data ─────────────────────────────────────────────────────────────────────

interface Movement {
  id: string
  date: string
  operation: string
  description: string
  debit: number | null
  credit: number | null
  balance: number
}

const MOVEMENTS: Movement[] = [
  { id: '1', date: '17.03.2026', operation: 'ОП-00123', description: 'Поступление оплаты за обучение',  debit: 850_000,   credit: null,      balance: 15_000_000 },
  { id: '2', date: '16.03.2026', operation: 'ОП-00122', description: 'Выплата заработной платы',        debit: null,      credit: 1_200_000, balance: 14_150_000 },
  { id: '3', date: '15.03.2026', operation: 'ОП-00120', description: 'Поступление оплаты за обучение',  debit: 950_000,   credit: null,      balance: 15_350_000 },
  { id: '4', date: '14.03.2026', operation: 'ОП-00119', description: 'Оплата коммунальных услуг',       debit: null,      credit: 125_000,   balance: 14_400_000 },
  { id: '5', date: '13.03.2026', operation: 'ОП-00118', description: 'Оплата аренды помещений',         debit: null,      credit: 180_000,   balance: 14_525_000 },
]

const ACCOUNTS = [
  '1030 - Денежные средства на счетах в банках',
  '1010 - Денежные средства в кассе',
  '1210 - Дебиторская задолженность',
  '2410 - Кредиторская задолженность',
  '6010 - Доход от реализации',
  '7110 - Расходы по зарплате',
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(v: number): string {
  return v.toLocaleString('ru-RU') + ' ₸'
}

function fmtNum(v: number | null): string {
  if (v === null) return '—'
  return v.toLocaleString('ru-RU')
}

// ─── shared classes ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

// ─── sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  valueClass = 'text-gray-800',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-xl font-semibold mt-2 leading-none ${valueClass}`}>{value}</p>
    </div>
  )
}

function MovementsTable() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-32">
              Дата
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-32">
              Операция
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3">
              Описание
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Дебет
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Кредит
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-44">
              Остаток
            </th>
          </tr>
        </thead>
        <tbody>
          {MOVEMENTS.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="px-5 py-3.5 text-gray-500 tabular-nums">
                {row.date}
              </td>
              <td className="px-4 py-3.5">
                <span className="text-sm font-medium text-blue-600">
                  {row.operation}
                </span>
              </td>
              <td className="px-4 py-3.5 text-gray-700">
                {row.description}
              </td>
              <td className="px-4 py-3.5 text-right tabular-nums">
                {row.debit !== null ? (
                  <span className="font-medium text-green-600">{fmtNum(row.debit)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right tabular-nums">
                {row.credit !== null ? (
                  <span className="font-medium text-red-500">{fmtNum(row.credit)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums font-medium text-gray-700">
                {fmtMoney(row.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AccountAnalysisPage() {
  const [account, setAccount] = useState(ACCOUNTS[0])
  const [dateFrom, setDateFrom] = useState('2026-03-01')
  const [dateTo, setDateTo]     = useState('2026-03-31')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────────── */}
        <PageHeaderWithAction
          title="Анализ счета"
          subtitle="Подробная история движений по выбранному счету"
          action={
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={15} />
              Экспорт
            </button>
          }
        />

        {/* ── filter card ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <div className="flex gap-4">

            <div className="flex-[2] flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Счет</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className={inputCls}
              >
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
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

        {/* ── summary stat cards ──────────────────────────────────────── */}
        <div className="flex gap-4">
          <SummaryCard
            label="Начальный остаток"
            value={fmtMoney(14_000_000)}
          />
          <SummaryCard
            label="Обороты за период"
            value={'+' + fmtMoney(1_800_000)}
            valueClass="text-green-600"
          />
          <SummaryCard
            label="Конечный остаток"
            value={fmtMoney(15_000_000)}
          />
        </div>

        {/* ── movements table ─────────────────────────────────────────── */}
        <MovementsTable />

      </div>
    </div>
  )
}
