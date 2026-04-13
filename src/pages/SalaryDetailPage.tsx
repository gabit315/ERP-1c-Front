import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, User } from 'lucide-react'
import { getEmployeeForPayroll, getBaseSalary } from '../services/payrollService'
import type { Employee } from '../api/employees'
import type { AllowanceConfig } from '../types/salary'
import {
  DEFAULT_ALLOWANCES,
  calculatePayroll,
  formatCurrency,
  TAX_RATES,
} from '../utils/salaryCalculations'

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
          <p className="text-sm font-medium text-gray-800">{config.label}</p>
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

// ─── calculation row ──────────────────────────────────────────────────────────

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
    positive: 'text-green-600',
    negative: 'text-red-500',
    total: 'text-gray-900 font-bold text-base',
  }[variant]

  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className={`text-sm ${variant === 'total' ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
          {label}
        </p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <p className={`text-sm font-mono shrink-0 ml-4 ${valueClass}`}>{value}</p>
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
    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
      {initials || <User size={24} />}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

interface SalaryDetailPageProps {
  employeeId: number
  onBack: () => void
}

export default function SalaryDetailPage({ employeeId, onBack }: SalaryDetailPageProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allowances, setAllowances] = useState<AllowanceConfig[]>(DEFAULT_ALLOWANCES)
  const [status, setStatus] = useState<'draft' | 'calculated' | 'posted'>('draft')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getEmployeeForPayroll(employeeId)
      .then((emp) => {
        setEmployee(emp)
        // reset allowances when switching employees
        setAllowances(DEFAULT_ALLOWANCES.map((a) => ({ ...a, enabled: false })))
        setStatus('draft')
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }, [employeeId])

  const baseSalary = useMemo(
    () => (employee ? getBaseSalary(employee.id) : 0),
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
    if (status === 'posted') setStatus('draft')
  }

  function handlePost() {
    setStatus('posted')
  }

  function handleSaveDraft() {
    setStatus('calculated')
  }

  // ── loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-gray-400">Загрузка...</span>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <span className="text-sm text-red-500">{error ?? 'Сотрудник не найден'}</span>
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Назад
        </button>
      </div>
    )
  }

  const enabledAllowanceCount = allowances.filter((a) => a.enabled).length
  const totalPercentIncrease =
    baseSalary > 0 ? Math.round((calc.allowancesTotal / baseSalary) * 100) : 0

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* page header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Назад
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{employee.fullName}</h1>
            <p className="text-sm text-gray-500">{employee.position}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                status === 'posted'
                  ? 'bg-green-50 text-green-700'
                  : status === 'calculated'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status === 'posted' ? 'Проведено' : status === 'calculated' ? 'Рассчитано' : 'Черновик'}
            </span>
            <button
              onClick={handleSaveDraft}
              disabled={status === 'posted'}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Сохранить черновик
            </button>
            <button
              onClick={handlePost}
              disabled={status === 'posted'}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Провести начисление
            </button>
          </div>
        </div>

        {/* main content: two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* left column: employee card + allowances */}
          <div className="flex flex-col gap-5">

            {/* employee card */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <AvatarInitials name={employee.fullName} />
                <div>
                  <p className="font-semibold text-gray-800">{employee.fullName}</p>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ИИН</span>
                  <span className="font-mono text-gray-700">{employee.iin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Подразделение</span>
                  <span className="text-gray-700 text-right max-w-[150px]">{employee.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Базовый оклад</span>
                  <span className="font-mono font-semibold text-gray-800">{formatCurrency(baseSalary)}</span>
                </div>
              </div>
            </div>

            {/* allowances block */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Настройки надбавок</h2>
                {enabledAllowanceCount > 0 && (
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                    {enabledAllowanceCount} активно
                  </span>
                )}
              </div>
              <div>
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
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-600">Итого надбавок</span>
                  <span className="font-semibold text-blue-600">
                    + {formatCurrency(calc.allowancesTotal)}
                    <span className="text-xs text-blue-400 ml-1">({totalPercentIncrease}%)</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* right column: calculation breakdown */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* gross calculation */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Начисление</h2>
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
            </div>

            {/* deductions */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Удержания</h2>
              <CalcRow
                label="ОПВ"
                value={`- ${formatCurrency(calc.opv)}`}
                sub={`${TAX_RATES.OPV * 100}% от gross`}
                variant="negative"
              />
              <CalcRow
                label="ОСМС"
                value={`- ${formatCurrency(calc.osms)}`}
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
                value={`- ${formatCurrency(calc.iit)}`}
                sub={`${TAX_RATES.IIT * 100}% от облагаемого дохода`}
                variant="negative"
              />
              <CalcRow
                label="Итого удержаний"
                value={`- ${formatCurrency(calc.deductions)}`}
                variant="total"
              />
            </div>

            {/* net + employer costs */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Итоговый расчёт</h2>
              <CalcRow
                label="К выдаче (Net)"
                value={formatCurrency(calc.netSalary)}
                variant="total"
              />
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
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
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
