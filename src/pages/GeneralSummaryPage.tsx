import { useState } from 'react'
import { Download, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import KPIStatCard from '../components/ui/KPIStatCard'
import SectionCard from '../components/ui/SectionCard'

// ─── static data ──────────────────────────────────────────────────────────────

const PERIODS = ['I квартал 2026', 'Март 2026', 'Февраль 2026', 'Январь 2026', 'Весь год']

const MONTHS = [
  { name: 'Январь', income: 7_200_000, expense: 5_800_000 },
  { name: 'Февраль', income: 7_800_000, expense: 6_100_000 },
  { name: 'Март',    income: 8_200_000, expense: 6_100_000 },
]

const EXPENSES = [
  { label: 'Зарплата',          amount: 4_100_000, pct: 67 },
  { label: 'Аренда',            amount: 850_000,   pct: 14 },
  { label: 'Коммунальные услуги', amount: 320_000, pct: 5  },
  { label: 'Канцелярия',        amount: 280_000,   pct: 5  },
  { label: 'Прочие расходы',    amount: 550_000,   pct: 9  },
]

const EXPENSE_TOTAL = 6_100_000

// Normalize monthly bars against a fixed ceiling so widths are stable
const BAR_MAX = 9_000_000

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return v.toLocaleString('ru-RU')
}

function fmtMoney(v: number): string {
  return fmt(v) + ' ₸'
}

// ─── sub-components ───────────────────────────────────────────────────────────

function MonthBlock({ name, income, expense }: { name: string; income: number; expense: number }) {
  const profit = income - expense
  const incPct = Math.round((income / BAR_MAX) * 100)
  const expPct = Math.round((expense / BAR_MAX) * 100)

  return (
    <div className="py-3.5 border-b border-gray-100 last:border-0">
      {/* month + profit */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className="text-sm font-medium text-green-600">+{fmtMoney(profit)}</span>
      </div>

      {/* income bar */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-gray-400 w-14 shrink-0">Доходы</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full"
            style={{ width: `${incPct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-gray-600 w-28 text-right shrink-0">
          {fmtMoney(income)}
        </span>
      </div>

      {/* expense bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14 shrink-0">Расходы</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-300 rounded-full"
            style={{ width: `${expPct}%` }}
          />
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
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function GeneralSummaryPage() {
  const [period, setPeriod] = useState('I квартал 2026')

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
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
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
        </div>

        {/* ── KPI cards ───────────────────────────────────────────────── */}
        <div className="flex gap-4">
          <KPIStatCard
            title="Общие доходы"
            value={fmtMoney(23_200_000)}
            icon={<TrendingUp size={18} className="text-green-600" />}
            iconBg="bg-green-50"
            trend="up"
            trendLabel="+8.2% за период"
          />
          <KPIStatCard
            title="Общие расходы"
            value={fmtMoney(18_000_000)}
            subtitle={fmt(18_000_000) + ' за период'}
            icon={<TrendingDown size={18} className="text-red-500" />}
            iconBg="bg-red-50"
          />
          <KPIStatCard
            title="Чистая прибыль"
            value={fmtMoney(5_200_000)}
            icon={<DollarSign size={18} className="text-blue-600" />}
            iconBg="bg-blue-50"
            trend="up"
            trendLabel="+22.4% рентабельность"
          />
          <KPIStatCard
            title="Остаток денег"
            value={fmtMoney(15_450_000)}
            subtitle="На счетах и в кассе"
            icon={<Wallet size={18} className="text-purple-600" />}
            iconBg="bg-purple-50"
          />
        </div>

        {/* ── two-column lower section ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* left: monthly income vs expense */}
          <SectionCard title="Доходы и расходы по месяцам">
            <div className="flex flex-col">
              {MONTHS.map((m) => (
                <MonthBlock
                  key={m.name}
                  name={m.name}
                  income={m.income}
                  expense={m.expense}
                />
              ))}
            </div>
          </SectionCard>

          {/* right: expense structure */}
          <SectionCard title="Структура расходов">
            <div className="flex flex-col">
              {EXPENSES.map((e) => (
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
                  {fmtMoney(EXPENSE_TOTAL)}
                </span>
              </div>
            </div>
          </SectionCard>

        </div>

      </div>
    </div>
  )
}
