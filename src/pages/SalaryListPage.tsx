import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Eye,
  Pencil,
  Calculator,
  Plus,
  Users,
  CheckCircle,
  FileText,
  Banknote,
  Info,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react'
import { getPayrollList } from '../services/payrollService'
import { calculatePayroll, postPayroll } from '../api/payroll'
import type { PayrollListItem, PayrollStatus } from '../types/salary'
import { formatCurrency } from '../utils/salaryCalculations'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PayrollStatus, string> = {
  not_calculated: 'Не рассчитано',
  calculated:     'Рассчитано',
  processing:     'Проведено',
  paid:           'Выплачено',
}

const STATUS_CLASS: Record<PayrollStatus, string> = {
  not_calculated: 'bg-gray-100 text-gray-500 border border-gray-200',
  calculated:     'bg-blue-50 text-blue-600 border border-blue-200',
  processing:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  paid:           'bg-purple-50 text-purple-700 border border-purple-200',
}

const MONTHS = [
  { value: '2026-01', label: 'Январь 2026' },
  { value: '2026-02', label: 'Февраль 2026' },
  { value: '2026-03', label: 'Март 2026' },
  { value: '2026-04', label: 'Апрель 2026' },
  { value: '2026-05', label: 'Май 2026' },
  { value: '2026-06', label: 'Июнь 2026' },
]

const WORKED_DAYS_DEFAULT = 22

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
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
    <div
      className={`bg-white rounded-xl border flex items-center gap-4 px-5 py-4 ${
        accent ? 'border-blue-200' : 'border-gray-200'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          accent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 leading-none mb-1.5">{label}</p>
        <p
          className={`text-xl font-bold leading-none ${
            accent ? 'text-blue-600' : 'text-gray-900'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── info banner ──────────────────────────────────────────────────────────────

function InfoBanner() {
  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
      <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
      <p className="text-sm text-blue-700 leading-relaxed">
        Здесь производится расчёт и начисление заработной платы. Выберите сотрудников,
        рассчитайте зарплату и проведите начисление за выбранный месяц.
      </p>
    </div>
  )
}

// ─── checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        checked || indeterminate
          ? 'bg-blue-600 border-blue-600'
          : 'bg-white border-gray-300 hover:border-blue-400'
      }`}
    >
      {indeterminate && !checked ? (
        <span className="w-2 h-0.5 bg-white rounded-full block" />
      ) : checked ? (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  )
}

// ─── table ────────────────────────────────────────────────────────────────────

function PayrollTable({
  rows,
  loading,
  error,
  onRetry,
  onView,
  selected,
  onToggleSelect,
  onToggleAll,
}: {
  rows: PayrollListItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onView: (id: number) => void
  selected: Set<number>
  onToggleSelect: (id: number) => void
  onToggleAll: () => void
}) {
  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && selected.size < rows.length

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Загрузка сотрудников...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
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

  const COL_HEADERS = [
    { key: 'name', label: 'Сотрудник', align: 'left' },
    { key: 'position', label: 'Должность', align: 'left' },
    { key: 'days', label: 'Отраб. дней', align: 'right' },
    { key: 'gross', label: 'Gross', align: 'right' },
    { key: 'deductions', label: 'Удержания', align: 'right' },
    { key: 'net', label: 'К выдаче', align: 'right' },
    { key: 'status', label: 'Статус', align: 'left' },
    { key: 'actions', label: '', align: 'left' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            {/* checkbox col */}
            <th className="pl-4 pr-2 py-3 w-8">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleAll}
              />
            </th>
            {COL_HEADERS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-[11px] font-semibold text-gray-400 tracking-widest uppercase whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center text-sm text-gray-400 py-16">
                Нет данных о сотрудниках
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isSelected = selected.has(row.employeeId)
              return (
                <tr
                  key={row.employeeId}
                  onClick={() => onToggleSelect(row.employeeId)}
                  className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/60 hover:bg-blue-50'
                      : 'hover:bg-gray-50/70'
                  }`}
                >
                  {/* checkbox */}
                  <td
                    className="pl-4 pr-2 py-3.5 w-8"
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(row.employeeId) }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelect(row.employeeId)}
                    />
                  </td>

                  {/* name */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-medium whitespace-nowrap ${
                        isSelected ? 'text-blue-700' : 'text-gray-800'
                      }`}
                    >
                      {row.fullName}
                    </span>
                  </td>

                  {/* position */}
                  <td className="px-4 py-3.5 text-gray-500 max-w-[180px] truncate">
                    {row.position}
                  </td>

                  {/* worked days */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-mono text-gray-600">{WORKED_DAYS_DEFAULT}</span>
                  </td>

                  {/* gross */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-mono font-medium text-gray-800">
                      {formatCurrency(row.gross)}
                    </span>
                  </td>

                  {/* deductions */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-mono text-red-500">
                      −{formatCurrency(row.deductions)}
                    </span>
                  </td>

                  {/* net */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-mono font-semibold text-emerald-700">
                      {formatCurrency(row.netSalary)}
                    </span>
                  </td>

                  {/* status */}
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_CLASS[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>

                  {/* actions */}
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => onView(row.employeeId)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Просмотр"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onView(row.employeeId)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Редактировать"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>

        {/* totals row */}
        {rows.length > 0 && !loading && (
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50/80">
              <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Итого по {rows.length} сотрудникам
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                {formatCurrency(rows.reduce((s, r) => s + r.gross, 0))}
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-red-500">
                −{formatCurrency(rows.reduce((s, r) => s + r.deductions, 0))}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                {formatCurrency(rows.reduce((s, r) => s + r.netSalary, 0))}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

// ─── sticky action bar ────────────────────────────────────────────────────────

function StickyActionBar({
  count,
  onClear,
  onCalculate,
  onPost,
  disabled,
}: {
  count: number
  onClear: () => void
  onCalculate: () => void
  onPost: () => void
  disabled?: boolean
}) {
  if (count === 0) return null

  return (
    <div
      className="sticky bottom-0 z-20 bg-white border-t border-gray-200 px-6 py-3.5"
      style={{ boxShadow: '0 -4px 24px 0 rgba(0,0,0,0.07)' }}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <CheckCircle size={14} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              Выбрано: {count} {count === 1 ? 'сотрудник' : count < 5 ? 'сотрудника' : 'сотрудников'}
            </span>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Снять выделение"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCalculate}
            disabled={disabled}
            className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator size={14} />
            Рассчитать выбранных
          </button>
          <button
            onClick={onPost}
            disabled={disabled}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <CheckCircle size={14} />
            Провести выбранных
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

interface SalaryListPageProps {
  onSelectEmployee: (id: number, period: string) => void
}

export default function SalaryListPage({ onSelectEmployee }: SalaryListPageProps) {
  const [rows, setRows] = useState<PayrollListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState('2026-04')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

  // Автоскрытие уведомления
  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(t)
  }, [notification])

  // ── Рассчитать выбранных (POST /api/payroll/calculate) ──────────────────
  async function handleCalculate(employeeIds: number[]) {
    if (employeeIds.length === 0) return
    setActionLoading(true)
    setNotification(null)
    try {
      await calculatePayroll(month, employeeIds)
      setSelected(new Set())
      load()
      setNotification({
        type: 'success',
        message: `Расчёт запущен для ${employeeIds.length} ${employeeIds.length === 1 ? 'сотрудника' : 'сотрудников'}`,
      })
    } catch (e) {
      setNotification({ type: 'error', message: e instanceof Error ? e.message : 'Ошибка расчёта' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Провести выбранных (POST /api/payroll/{id}/post) ────────────────────
  async function handlePost(employeeIds: number[]) {
    const toPost = rows.filter(
      (r) => employeeIds.includes(r.employeeId) && r.status === 'calculated' && r.payrollId,
    )
    if (toPost.length === 0) {
      setNotification({ type: 'error', message: 'Нет рассчитанных записей для проведения' })
      return
    }
    setActionLoading(true)
    setNotification(null)
    try {
      await Promise.all(toPost.map((r) => postPayroll(r.payrollId!)))
      setSelected(new Set())
      load()
      setNotification({
        type: 'success',
        message: `Проведено ${toPost.length} ${toPost.length === 1 ? 'запись' : 'записей'}`,
      })
    } catch (e) {
      setNotification({ type: 'error', message: e instanceof Error ? e.message : 'Ошибка проведения' })
    } finally {
      setActionLoading(false)
    }
  }

  const summary = useMemo(() => {
    const total      = rows.length
    const calculated = rows.filter((r) => r.status === 'calculated').length
    const posted     = rows.filter((r) => r.status === 'processing' || r.status === 'paid').length
    const fot        = rows.reduce((sum, r) => sum + r.gross, 0)
    return { total, calculated, posted, fot }
  }, [rows])

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((r) => r.employeeId)))
    }
  }

  const currentMonth = MONTHS.find((m) => m.value === month)?.label ?? month

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="flex-1 p-6 lg:p-8 max-w-screen-xl mx-auto w-full flex flex-col gap-6">

        {/* ── page header ───────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <div className="w-1 h-10 bg-blue-600 rounded-full mt-0.5 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Зарплата</h1>
              <p className="text-sm text-gray-500 mt-0.5">Начисление и расчёт заработной платы</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => void handleCalculate(rows.map((r) => r.employeeId))}
              disabled={loading || actionLoading || rows.length === 0}
              className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading
                ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <Calculator size={14} />
              }
              Рассчитать всех
            </button>
            <button
              onClick={() => void handlePost(rows.map((r) => r.employeeId))}
              disabled={loading || actionLoading || rows.every((r) => r.status !== 'calculated')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <CheckCircle size={14} />
              Провести всех
            </button>
          </div>
        </div>

        {/* ── notification ──────────────────────────────────────── */}
        {notification && (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success'
              ? <CheckCircle size={15} className="text-emerald-600 shrink-0" />
              : <AlertCircle size={15} className="text-red-500 shrink-0" />
            }
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="opacity-50 hover:opacity-80 transition-opacity ml-2"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── info banner ───────────────────────────────────────── */}
        <InfoBanner />

        {/* ── stats + month selector ────────────────────────────── */}
        <div className="flex items-stretch gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <StatCard
              icon={<Users size={18} />}
              label="Всего"
              value={String(summary.total)}
            />
            <StatCard
              icon={<FileText size={18} />}
              label="Рассчитано"
              value={String(summary.calculated)}
            />
            <StatCard
              icon={<CheckCircle size={18} />}
              label="Проведено"
              value={String(summary.posted)}
            />
            <StatCard
              icon={<Banknote size={18} />}
              label="ФОТ за месяц"
              value={formatCurrency(summary.fot)}
              accent
            />
          </div>

          {/* month selector */}
          <div className="shrink-0 flex flex-col justify-center">
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-9 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[160px] h-full"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ── table toolbar (shown when selection active) ───────── */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
              <CheckCircle size={15} className="text-blue-500" />
              Выбрано {selected.size}{' '}
              {selected.size === 1 ? 'сотрудник' : selected.size < 5 ? 'сотрудника' : 'сотрудников'}{' '}
              за {currentMonth}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Снять выделение
              </button>
              <button
                onClick={() => void handleCalculate([...selected])}
                disabled={actionLoading}
                className="flex items-center gap-1.5 border border-blue-300 hover:border-blue-400 bg-white hover:bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator size={13} />
                Рассчитать
              </button>
              <button
                onClick={() => void handlePost([...selected])}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <CheckCircle size={13} />
                Провести
              </button>
            </div>
          </div>
        )}

        {/* ── table ─────────────────────────────────────────────── */}
        <PayrollTable
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          onView={(id) => onSelectEmployee(id, month)}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
        />
      </div>

      {/* ── sticky bottom action bar ──────────────────────────────── */}
      <StickyActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onCalculate={() => void handleCalculate([...selected])}
        onPost={() => void handlePost([...selected])}
        disabled={actionLoading}
      />
    </div>
  )
}
