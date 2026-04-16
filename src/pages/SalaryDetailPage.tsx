import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, User, CheckCircle, TrendingDown, Wallet } from 'lucide-react'
import { getEmployee } from '../api/employees'
import { getEmployeePayrollForPeriod } from '../api/payroll'
import type { Employee } from '../api/employees'
import type { AllowanceConfig, PayrollStatus } from '../types/salary'
import {
  DEFAULT_ALLOWANCES,
  calculatePayroll,
  formatCurrency,
  TAX_RATES,
} from '../utils/salaryCalculations'

// ─── status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PayrollStatus, { label: string; cls: string }> = {
  calculated: { label: 'Рассчитано', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  processing: { label: 'Проведено',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  paid:       { label: 'Выплачено',  cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
}

// ─── allowance toggle row ─────────────────────────────────────────────────────

function AllowanceRow({
  config,
  baseSalary,
  onToggle,
}: {
  config: AllowanceConfig
  baseSalary: number
  onToggle: () => void
}) {
  const amount =
    config.type === 'percent'
      ? Math.round((baseSalary * config.value) / 100)
      : config.value

  const percent =
    config.type === 'percent'
      ? config.value
      : baseSalary > 0
        ? Math.round((config.value / baseSalary) * 1000) / 10
        : 0

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {/* toggle */}
        <button
          onClick={onToggle}
          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
            config.enabled ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              config.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>

        <div>
          <p className={`text-sm font-medium ${config.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
            {config.label}
          </p>
          <p className="text-xs text-gray-400">
            {config.type === 'percent'
              ? `${config.value}% от оклада`
              : `${formatCurrency(config.value)} (≈${percent}%)`}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`text-sm font-semibold ${
            config.enabled ? 'text-blue-600' : 'text-gray-300'
          }`}
        >
          {config.enabled ? `+ ${formatCurrency(amount)}` : formatCurrency(amount)}
        </p>
        <p className="text-xs text-gray-400">{percent}%</p>
      </div>
    </div>
  )
}

// ─── calc row ─────────────────────────────────────────────────────────────────

function CalcRow({
  label,
  value,
  sub,
  variant = 'default',
}: {
  label: string
  value: string
  sub?: string
  variant?: 'default' | 'positive' | 'negative' | 'total'
}) {
  const valueClass = {
    default: 'text-gray-700',
    positive: 'text-emerald-600',
    negative: 'text-red-500',
    total: 'text-gray-900 font-bold text-base',
  }[variant]

  const isTotal = variant === 'total'

  return (
    <div
      className={`flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0 ${
        isTotal ? 'bg-gray-50 -mx-5 px-5 rounded-b-xl' : ''
      }`}
    >
      <div>
        <p className={`text-sm ${isTotal ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
          {label}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm font-mono shrink-0 ml-4 ${valueClass}`}>{value}</p>
    </div>
  )
}

// ─── section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  footer,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 pb-5">{footer}</div>}
    </div>
  )
}

// ─── avatar initials ──────────────────────────────────────────────────────────

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0">
      {initials || <User size={22} />}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

interface SalaryDetailPageProps {
  employeeId: number
  period: string
  onBack: () => void
}

export default function SalaryDetailPage({ employeeId, period, onBack }: SalaryDetailPageProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allowances, setAllowances] = useState<AllowanceConfig[]>(DEFAULT_ALLOWANCES)
  const [status, setStatus] = useState<PayrollStatus>('calculated')

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getEmployee(employeeId),
      getEmployeePayrollForPeriod(employeeId, period),
    ])
      .then(([emp, payroll]) => {
        setEmployee(emp)
        setAllowances(DEFAULT_ALLOWANCES.map((a) => ({ ...a, enabled: false })))
        setStatus(payroll?.status ?? 'calculated')
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }, [employeeId, period])

  const baseSalary = useMemo(
    () => (employee ? (employee.baseSalary ?? 0) : 0),
    [employee],
  )

  const calc = useMemo(
    () => calculatePayroll(baseSalary, allowances),
    [baseSalary, allowances],
  )

  function toggleAllowance(id: string) {
    setAllowances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    )
    if (status === 'processing' || status === 'paid') setStatus('calculated')
  }

  // ── loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Загрузка...</span>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <span className="text-sm text-red-500">{error ?? 'Сотрудник не найден'}</span>
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Назад к списку
        </button>
      </div>
    )
  }

  const enabledAllowanceCount = allowances.filter((a) => a.enabled).length
  const totalPercentIncrease =
    baseSalary > 0 ? Math.round((calc.allowancesTotal / baseSalary) * 100) : 0
  const statusCfg = STATUS_CONFIG[status]

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 lg:p-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── page header ─────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-2 transition-colors"
          >
            <ArrowLeft size={14} />
            К списку
          </button>

          <div className="h-5 w-px bg-gray-200" />

          <div className="flex items-start gap-3">
            <div className="w-1 h-9 bg-blue-600 rounded-full shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{employee.fullName}</h1>
              <p className="text-sm text-gray-500">{employee.position}</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusCfg.cls}`}
            >
              {statusCfg.label}
            </span>
            <button
              onClick={() => setStatus('processing')}
              disabled={status === 'processing' || status === 'paid'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle size={14} />
              Провести начисление
            </button>
          </div>
        </div>

        {/* ── main grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* left column */}
          <div className="flex flex-col gap-5">

            {/* employee card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                <AvatarInitials name={employee.fullName} />
                <div>
                  <p className="font-semibold text-gray-900 leading-snug">{employee.fullName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{employee.position}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2.5">
                {[
                  { label: 'ИИН', value: employee.iin, mono: true },
                  { label: 'Подразделение', value: employee.department, mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between items-start gap-3 text-sm">
                    <span className="text-gray-400 shrink-0">{label}</span>
                    <span className={`text-right text-gray-700 ${mono ? 'font-mono' : ''} max-w-[170px]`}>
                      {value}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-100">
                  <span className="text-gray-400">Базовый оклад</span>
                  <span className="font-mono font-bold text-gray-900">{formatCurrency(baseSalary)}</span>
                </div>
              </div>
            </div>

            {/* allowances */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">Настройки надбавок</h2>
                {enabledAllowanceCount > 0 && (
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    {enabledAllowanceCount} активно
                  </span>
                )}
              </div>

              <div className="px-5">
                {allowances.map((a) => (
                  <AllowanceRow
                    key={a.id}
                    config={a}
                    baseSalary={baseSalary}
                    onToggle={() => toggleAllowance(a.id)}
                  />
                ))}
              </div>

              {calc.allowancesTotal > 0 && (
                <div className="mx-5 mb-5 mt-1 bg-blue-50 rounded-lg px-4 py-2.5 flex justify-between text-sm">
                  <span className="text-blue-600 font-medium">Итого надбавок</span>
                  <span className="font-semibold text-blue-700">
                    +{formatCurrency(calc.allowancesTotal)}
                    <span className="text-xs text-blue-400 ml-1">({totalPercentIncrease}%)</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* right column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* gross */}
            <SectionCard title="Начисление" icon={<Wallet size={14} />}>
              <CalcRow label="Базовый оклад" value={formatCurrency(calc.baseSalary)} />
              {calc.allowanceBreakdown
                .filter((a) => a.enabled)
                .map((a) => (
                  <CalcRow
                    key={a.id}
                    label={a.label}
                    value={`+ ${formatCurrency(a.amount)}`}
                    sub={`${a.percent}% от оклада`}
                    variant="positive"
                  />
                ))}
              <CalcRow
                label="Итого начислено (Gross)"
                value={formatCurrency(calc.gross)}
                variant="total"
              />
            </SectionCard>

            {/* deductions */}
            <SectionCard title="Удержания" icon={<TrendingDown size={14} />}>
              <CalcRow
                label="ОПВ"
                value={`− ${formatCurrency(calc.opv)}`}
                sub={`${TAX_RATES.OPV * 100}% от gross`}
                variant="negative"
              />
              <CalcRow
                label="ОСМС"
                value={`− ${formatCurrency(calc.osms)}`}
                sub={`${TAX_RATES.OSMS_EMPLOYEE * 100}% от gross`}
                variant="negative"
              />
              <CalcRow
                label="Облагаемый доход"
                value={formatCurrency(calc.taxableIncome)}
                sub="Gross − ОПВ"
              />
              <CalcRow
                label="ИПН"
                value={`− ${formatCurrency(calc.iit)}`}
                sub={`${TAX_RATES.IIT * 100}% от облагаемого дохода`}
                variant="negative"
              />
              <CalcRow
                label="Итого удержаний"
                value={`− ${formatCurrency(calc.deductions)}`}
                variant="total"
              />
            </SectionCard>

            {/* net + employer */}
            <SectionCard title="Итоговый расчёт" icon={<CheckCircle size={14} />}>

              {/* net salary highlight */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">К выдаче (Net)</p>
                  <p className="text-2xl font-bold text-emerald-700 font-mono">
                    {formatCurrency(calc.netSalary)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Wallet size={22} />
                </div>
              </div>

              {/* employer costs */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Нагрузка на работодателя
                </p>
                <CalcRow
                  label="Социальные отчисления"
                  value={formatCurrency(calc.employerSO)}
                  sub={`${TAX_RATES.EMPLOYER_SO * 100}% от (Gross − ОПВ)`}
                />
                <CalcRow
                  label="ОСМС работодателя"
                  value={formatCurrency(calc.employerOSMS)}
                  sub={`${TAX_RATES.EMPLOYER_OSMS * 100}% от gross`}
                />
                <CalcRow
                  label="Итого расходов компании"
                  value={formatCurrency(calc.totalCompanyCost)}
                  variant="total"
                />
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </div>
  )
}
