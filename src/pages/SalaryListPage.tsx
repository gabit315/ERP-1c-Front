import { useState, useEffect, useCallback, useMemo } from 'react'
import { Eye, Pencil, Calculator, Plus, Users, CheckCircle, FileText, Banknote } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import { getPayrollList } from '../services/payrollService'
import type { PayrollListItem, PayrollStatus } from '../types/salary'
import { formatCurrency } from '../utils/salaryCalculations'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PayrollStatus, string> = {
  draft: 'Черновик',
  calculated: 'Рассчитано',
  posted: 'Проведено',
}

const STATUS_CLASS: Record<PayrollStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  calculated: 'bg-blue-50 text-blue-600',
  posted: 'bg-green-50 text-green-700',
}

const MONTHS = [
  { value: '2026-01', label: 'Январь 2026' },
  { value: '2026-02', label: 'Февраль 2026' },
  { value: '2026-03', label: 'Март 2026' },
  { value: '2026-04', label: 'Апрель 2026' },
  { value: '2026-05', label: 'Май 2026' },
  { value: '2026-06', label: 'Июнь 2026' },
]

// ─── summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 bg-white border rounded-lg px-5 py-4 ${accent ? 'border-blue-200' : 'border-gray-200'}`}>
      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${accent ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-base font-semibold ${accent ? 'text-blue-600' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  )
}

// ─── table ────────────────────────────────────────────────────────────────────

function PayrollTable({
  rows,
  loading,
  error,
  onRetry,
  onView,
}: {
  rows: PayrollListItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onView: (id: number) => void
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
        <span className="text-sm text-gray-400">Загрузка сотрудников...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-sm text-red-500">{error}</span>
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {['ФИО', 'Должность', 'Оклад', 'Надбавки', 'Gross', 'Удержания', 'К выдаче', 'Статус', 'Действия'].map(
              (col) => (
                <th
                  key={col}
                  className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 whitespace-nowrap"
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center text-sm text-gray-400 py-12">
                Нет данных о сотрудниках
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.employeeId}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                  {row.fullName}
                </td>
                <td className="px-4 py-3.5 text-gray-600">{row.position}</td>
                <td className="px-4 py-3.5 text-gray-700 font-mono">
                  {formatCurrency(row.baseSalary)}
                </td>
                <td className="px-4 py-3.5 text-gray-600 font-mono">
                  {row.allowancesTotal > 0 ? formatCurrency(row.allowancesTotal) : '—'}
                </td>
                <td className="px-4 py-3.5 text-gray-800 font-mono font-medium">
                  {formatCurrency(row.gross)}
                </td>
                <td className="px-4 py-3.5 text-red-500 font-mono">
                  {formatCurrency(row.deductions)}
                </td>
                <td className="px-4 py-3.5 text-green-700 font-mono font-medium">
                  {formatCurrency(row.netSalary)}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CLASS[row.status]}`}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onView(row.employeeId)}
                      className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Просмотр"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => onView(row.employeeId)}
                      className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Редактировать"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

interface SalaryListPageProps {
  onSelectEmployee: (id: number) => void
}

export default function SalaryListPage({ onSelectEmployee }: SalaryListPageProps) {
  const [rows, setRows] = useState<PayrollListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState('2026-04')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getPayrollList(month)
      .then(setRows)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }, [month])

  useEffect(() => { load() }, [load])

  const summary = useMemo(() => {
    const total = rows.length
    const calculated = rows.filter((r) => r.status === 'calculated' || r.status === 'posted').length
    const draft = rows.filter((r) => r.status === 'draft').length
    const fot = rows.reduce((sum, r) => sum + r.gross, 0)
    return { total, calculated, draft, fot }
  }, [rows])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* header */}
        <PageHeaderWithAction
          title="Зарплата"
          subtitle="Расчёт и начисление заработной платы сотрудников"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Calculator size={15} />
                Рассчитать всех
              </button>
              <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                <Plus size={15} />
                Новое начисление
              </button>
            </div>
          }
        />

        {/* summary + month selector */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              <SummaryCard
                icon={<Users size={17} />}
                label="Сотрудников"
                value={String(summary.total)}
              />
              <SummaryCard
                icon={<CheckCircle size={17} />}
                label="Рассчитано"
                value={String(summary.calculated)}
              />
              <SummaryCard
                icon={<FileText size={17} />}
                label="Черновиков"
                value={String(summary.draft)}
              />
              <SummaryCard
                icon={<Banknote size={17} />}
                label="ФОТ за месяц"
                value={formatCurrency(summary.fot)}
                accent
              />
            </div>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* table */}
        <PayrollTable
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          onView={onSelectEmployee}
        />
      </div>
    </div>
  )
}
