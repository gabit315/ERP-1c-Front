/**
 * Страница редактирования сотрудника.
 *
 * ── Поля, сохраняемые в backend (PUT /api/employees/{id}):
 *    fullName, iin, position, department, baseSalary
 *
 * ── Поля только в UI (не хранятся в БД, сбрасываются при перезагрузке):
 *    hireDate, dismissalDate, employmentType, employeeStatus,
 *    rate, category, allowances, bank details, tax deductions, timesheet days
 *
 * ── История начислений: GET /api/payroll/?employee_id={id}&period={YYYY-MM}
 *    Запрашивается параллельно за последние 6 месяцев.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  History,
  Save,
  User,
  Plus,
  ChevronRight,
  CalendarDays,
  Wallet,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react'
import type { Employee, EmployeePayload } from '../api/employees'
import { getEmployee, updateEmployee } from '../api/employees'
import { getEmployeePayrollHistory, type PayrollHistoryItem, type PayrollStatus } from '../api/payroll'
import { formatCurrency } from '../utils/salaryCalculations'

// ─── constants ────────────────────────────────────────────────────────────────

const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
]

const PAYROLL_STATUS_LABEL: Record<PayrollStatus, string> = {
  calculated: 'Рассчитано',
  processing: 'Проведено',
  paid:       'Выплачено',
}

const PAYROLL_STATUS_CLS: Record<PayrollStatus, string> = {
  calculated: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid:       'bg-blue-50 text-blue-600 border-blue-200',
}

const SENIORITY_OPTIONS = [
  { value: '',   label: 'Не применяется' },
  { value: '0',  label: 'До 3 лет — 0%' },
  { value: '5',  label: 'От 3 до 5 лет — 5%' },
  { value: '10', label: 'От 5 до 10 лет — 10%' },
  { value: '15', label: 'От 10 до 20 лет — 15%' },
  { value: '20', label: 'Более 20 лет — 20%' },
]

// ─── period helpers ───────────────────────────────────────────────────────────

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function periodToLabel(period: string): string {
  const [year, month] = period.split('-')
  return `${MONTHS_RU[parseInt(month) - 1]} ${year}`
}

// ─── form state ───────────────────────────────────────────────────────────────

interface EditFormState {
  // ── backend-persisted ─────────────────────────────────────────
  fullName:   string
  iin:        string
  position:   string
  department: string
  baseSalary: string   // храним как строку для input, при сохранении конвертируем

  // ── UI-only (не сохраняется в backend) ────────────────────────
  employmentType:   'full' | 'part'
  hireDate:         string
  dismissalDate:    string
  employeeStatus:   'active' | 'vacation' | 'dismissed'
  rate:             '1.0' | '1.25' | '1.5'
  category:         string
  pedagogicalAllowance: boolean
  classManagement:      boolean
  ruralAllowance:       boolean
  seniorityAllowance:   string
  iik:              string
  bik:              string
  bankName:         string
  enpfAccount:      string
  standardDeduction:    string
  additionalDeduction:  string
  workDays:         string
  sickDays:         string
  vacationDays:     string
}

function initForm(e: Employee): EditFormState {
  return {
    fullName:   e.fullName,
    iin:        e.iin,
    position:   e.position,
    department: e.department,
    baseSalary: e.baseSalary != null ? String(e.baseSalary) : '',

    // UI-only defaults
    employmentType:       'full',
    hireDate:             '',
    dismissalDate:        '',
    employeeStatus:       'active',
    rate:                 '1.0',
    category:             'Специалист',
    pedagogicalAllowance: false,
    classManagement:      false,
    ruralAllowance:       false,
    seniorityAllowance:   '10',
    iik:                  '',
    bik:                  '',
    bankName:             '',
    enpfAccount:          '',
    standardDeduction:    '42500',
    additionalDeduction:  '0',
    workDays:             '22',
    sickDays:             '0',
    vacationDays:         '0',
  }
}

// ─── ui primitives ────────────────────────────────────────────────────────────

function SectionCard({
  title, subtitle, children, action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function SubSection({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
      {label}
    </p>
  )
}

function FieldGroup({
  label, children, hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-none">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

/** Плашка "только UI" рядом с заголовком секции */
function UiOnlyBadge() {
  return (
    <span
      title="Эти данные хранятся только в браузере и не сохраняются в базе данных"
      className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full cursor-default"
    >
      <Info size={9} />
      UI-only
    </span>
  )
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white ' +
  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'focus:border-blue-500 transition-colors'

function SegmentedControl<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; color?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
              active
                ? opt.color
                  ? `${opt.color} shadow-sm`
                  : 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleRow({
  label, description, value, onChange, badge,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
            value ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <div className="min-w-0">
          <p className={`text-sm font-medium leading-snug ${value ? 'text-gray-800' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      {badge && (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-3 shrink-0 ${
            value
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

function SummaryRow({
  label, value, variant = 'default', large,
}: {
  label: string
  value: string
  variant?: 'default' | 'positive' | 'negative' | 'muted'
  large?: boolean
}) {
  const valueColor = {
    default:  'text-gray-900',
    positive: 'text-emerald-700',
    negative: 'text-red-500',
    muted:    'text-gray-500',
  }[variant]

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className={`text-sm ${large ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold ${valueColor} ${large ? 'text-base' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function Avatar({ name, size = 'lg' }: { name: string; size?: 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm'
  return (
    <div className={`rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 ${sz}`}>
      {initials || <User size={size === 'lg' ? 24 : 16} />}
    </div>
  )
}

// ─── history item ─────────────────────────────────────────────────────────────

function HistoryItem({ item }: { item: PayrollHistoryItem }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
          <CalendarDays size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-snug">{periodToLabel(item.period)}</p>
          <p className="text-xs text-gray-400">Gross {formatCurrency(item.totalAccrued)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0 ml-3">
        <span className="font-mono text-sm font-semibold text-gray-900">
          {formatCurrency(item.netPay)}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PAYROLL_STATUS_CLS[item.status]}`}
        >
          {PAYROLL_STATUS_LABEL[item.status]}
        </span>
      </div>
    </div>
  )
}

// ─── notification toast ───────────────────────────────────────────────────────

type Notification = { type: 'success' | 'error'; message: string }

function Toast({ note, onDismiss }: { note: Notification; onDismiss: () => void }) {
  const isSuccess = note.type === 'success'
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {isSuccess
        ? <CheckCircle size={16} className="text-emerald-600 shrink-0" />
        : <AlertCircle size={16} className="text-red-500 shrink-0" />
      }
      <span className="flex-1">{note.message}</span>
      <button
        onClick={onDismiss}
        className="text-current opacity-50 hover:opacity-80 transition-opacity ml-2"
      >
        ✕
      </button>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

interface EmployeeEditPageProps {
  employee: Employee   // содержит id и базовые поля для первичного рендера
  onBack: () => void
}

export default function EmployeeEditPage({ employee, onBack }: EmployeeEditPageProps) {
  // ── form state (инициализируем из пропа, обновляем после загрузки) ─────────
  const [form, setForm] = useState<EditFormState>(() => initForm(employee))

  // ── загрузка ──────────────────────────────────────────────────────────────
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ── история начислений ────────────────────────────────────────────────────
  const [history, setHistory]           = useState<PayrollHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  // ── сохранение ────────────────────────────────────────────────────────────
  const [saving, setSaving]             = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  // ── загружаем полные данные сотрудника по id ───────────────────────────────
  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    getEmployee(employee.id)
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          fullName:   data.fullName,
          iin:        data.iin,
          position:   data.position,
          department: data.department,
          baseSalary: data.baseSalary != null ? String(data.baseSalary) : '',
        }))
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки данных')
      })
      .finally(() => setLoading(false))
  }, [employee.id])

  // ── загружаем историю начислений (последние 6 месяцев) ────────────────────
  useEffect(() => {
    setHistoryLoading(true)
    getEmployeePayrollHistory(employee.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [employee.id])

  // ── автоскрытие уведомления через 5 сек ──────────────────────────────────
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(timer)
  }, [notification])

  function set<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── сохранение: отправляем только поля, поддерживаемые backend ────────────
  async function handleSave() {
    setSaving(true)
    setNotification(null)
    try {
      const baseSalaryNum = parseFloat(form.baseSalary)
      const payload: EmployeePayload = {
        full_name:  form.fullName.trim(),
        position:   form.position.trim(),
        department: form.department.trim(),
        iin:        form.iin.trim(),
        // base_salary: если поле пустое — не передаём, backend оставит прежнее значение
        ...(Number.isFinite(baseSalaryNum) && baseSalaryNum > 0
          ? { base_salary: baseSalaryNum }
          : {}),
      }
      await updateEmployee(employee.id, payload)
      setNotification({ type: 'success', message: 'Изменения успешно сохранены' })
    } catch (e: unknown) {
      setNotification({
        type: 'error',
        message: e instanceof Error ? e.message : 'Ошибка при сохранении',
      })
    } finally {
      setSaving(false)
    }
  }

  // ── расчётный gross (UI-оценка) ───────────────────────────────────────────
  const estimatedGross = useMemo(() => {
    const base      = parseFloat(form.baseSalary) || 0
    const rate      = parseFloat(form.rate) || 1
    const seniority = parseFloat(form.seniorityAllowance) || 0
    const pedagogical = form.pedagogicalAllowance ? base * 0.30 : 0
    const classMgmt   = form.classManagement       ? 8000        : 0
    const rural       = form.ruralAllowance         ? base * 0.25 : 0
    const sen         = base * (seniority / 100)
    return Math.round(base * rate + pedagogical + classMgmt + rural + sen)
  }, [
    form.baseSalary, form.rate, form.seniorityAllowance,
    form.pedagogicalAllowance, form.classManagement, form.ruralAllowance,
  ])

  // ── данные для "Табель" — самый свежий реальный период (если есть) ────────
  const latestPayroll = history[0] ?? null
  const tabPeriod     = latestPayroll?.period ?? currentPeriod()

  // ── загрузка / ошибка ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Загрузка сотрудника...</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-600 font-medium">{loadError}</p>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Вернуться к списку
        </button>
      </div>
    )
  }

  const statusOptions = [
    { value: 'active'    as const, label: 'Активен',   color: 'bg-emerald-50 text-emerald-700' },
    { value: 'vacation'  as const, label: 'В отпуске', color: 'bg-amber-50 text-amber-700' },
    { value: 'dismissed' as const, label: 'Уволен',    color: 'bg-red-50 text-red-600' },
  ]

  const rateOptions = [
    { value: '1.0'  as const, label: '1.0' },
    { value: '1.25' as const, label: '1.25' },
    { value: '1.5'  as const, label: '1.5' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 lg:p-8 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-2 transition-colors shrink-0 mt-0.5"
            >
              <ArrowLeft size={14} />
              К списку
            </button>

            <div className="flex items-start gap-3">
              <div className="w-1 h-12 bg-blue-600 rounded-full shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Сотрудник
                </p>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{form.fullName}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Карточка сотрудника и зарплатные параметры
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <History size={14} />
              История начислений
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saving
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save size={14} />
              }
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>

        {/* ── notification toast ────────────────────────────────────── */}
        {notification && (
          <Toast note={notification} onDismiss={() => setNotification(null)} />
        )}

        {/* ── main grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ══════════════ LEFT COLUMN ══════════════ */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* ── 1. Основные данные — сохраняется в backend ──────── */}
            <SectionCard
              title="Основные данные"
              subtitle="Сохраняется в базе данных"
            >
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <Avatar name={form.fullName} size="lg" />
                <div>
                  <p className="text-base font-bold text-gray-900 leading-snug">{form.fullName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{form.position}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {form.department}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        form.employeeStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : form.employeeStatus === 'vacation'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}
                    >
                      {statusOptions.find((o) => o.value === form.employeeStatus)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* backend-сохраняемые поля */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-5 mb-6">
                <FieldGroup label="ФИО">
                  <input
                    className={inputCls}
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    placeholder="Иванова Анна Петровна"
                  />
                </FieldGroup>

                <FieldGroup label="ИИН">
                  <input
                    className={`${inputCls} font-mono`}
                    value={form.iin}
                    onChange={(e) => set('iin', e.target.value)}
                    placeholder="880415350283"
                    maxLength={12}
                  />
                </FieldGroup>

                <FieldGroup label="Должность">
                  <input
                    className={inputCls}
                    value={form.position}
                    onChange={(e) => set('position', e.target.value)}
                    placeholder="Учитель математики"
                  />
                </FieldGroup>

                <FieldGroup label="Подразделение">
                  <input
                    className={inputCls}
                    value={form.department}
                    onChange={(e) => set('department', e.target.value)}
                    placeholder="Математика"
                  />
                </FieldGroup>
              </div>

              {/* UI-only поля */}
              <div className="border-t border-dashed border-gray-200 pt-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                    Дополнительно
                  </p>
                  <UiOnlyBadge />
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                  <FieldGroup label="Дата приёма">
                    <input
                      type="date"
                      className={inputCls}
                      value={form.hireDate}
                      onChange={(e) => set('hireDate', e.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Дата увольнения" hint="Оставьте пустым для действующего">
                    <input
                      type="date"
                      className={inputCls}
                      value={form.dismissalDate}
                      onChange={(e) => set('dismissalDate', e.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup label="Тип занятости">
                    <select
                      className={inputCls}
                      value={form.employmentType}
                      onChange={(e) => set('employmentType', e.target.value as 'full' | 'part')}
                    >
                      <option value="full">Основное место работы</option>
                      <option value="part">Совместительство</option>
                    </select>
                  </FieldGroup>
                </div>
              </div>

              <FieldGroup label="Статус сотрудника">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SegmentedControl
                      options={statusOptions}
                      value={form.employeeStatus}
                      onChange={(v) => set('employeeStatus', v)}
                    />
                  </div>
                  <UiOnlyBadge />
                </div>
              </FieldGroup>
            </SectionCard>

            {/* ── 2. Зарплатные параметры ─────────────────────────── */}
            <SectionCard
              title="Зарплатные параметры"
              subtitle="Базовый оклад сохраняется в backend; надбавки — только в UI"
            >
              <SubSection label="Начисления" />
              <div className="grid grid-cols-2 gap-x-5 gap-y-5 mb-6">
                <FieldGroup label="Базовый оклад (₸)" hint="Сохраняется в базе данных">
                  <div className="relative">
                    <input
                      type="number"
                      className={`${inputCls} pr-7`}
                      value={form.baseSalary}
                      onChange={(e) => set('baseSalary', e.target.value)}
                      placeholder="120000"
                      min={0}
                      step={1000}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                      ₸
                    </span>
                  </div>
                </FieldGroup>

                <FieldGroup label="Категория">
                  <select
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                  >
                    <option>Специалист</option>
                    <option>Старший специалист</option>
                    <option>Ведущий специалист</option>
                    <option>Руководитель</option>
                  </select>
                </FieldGroup>

                <div className="col-span-2">
                  <FieldGroup label="Ставка">
                    <SegmentedControl
                      options={rateOptions}
                      value={form.rate}
                      onChange={(v) => set('rate', v)}
                    />
                  </FieldGroup>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-5 mb-1">
                <div className="flex items-center gap-2 mb-4">
                  <SubSection label="Надбавки и доплаты" />
                  <UiOnlyBadge />
                </div>

                <ToggleRow
                  label="Педагогическая надбавка"
                  description="30% от базового оклада"
                  badge={`+${formatCurrency(Math.round((parseFloat(form.baseSalary) || 0) * 0.30))}`}
                  value={form.pedagogicalAllowance}
                  onChange={(v) => set('pedagogicalAllowance', v)}
                />
                <ToggleRow
                  label="Классное руководство"
                  description="Фиксированная доплата 8 000 ₸"
                  badge="+8 000 ₸"
                  value={form.classManagement}
                  onChange={(v) => set('classManagement', v)}
                />
                <ToggleRow
                  label="Надбавка сельской местности"
                  description="25% от базового оклада"
                  badge={`+${formatCurrency(Math.round((parseFloat(form.baseSalary) || 0) * 0.25))}`}
                  value={form.ruralAllowance}
                  onChange={(v) => set('ruralAllowance', v)}
                />

                <div className="mt-4 mb-5 grid grid-cols-2">
                  <FieldGroup label="Надбавка за стаж">
                    <select
                      className={inputCls}
                      value={form.seniorityAllowance}
                      onChange={(e) => set('seniorityAllowance', e.target.value)}
                    >
                      {SENIORITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                </div>

                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-2 transition-colors mb-6"
                >
                  <Plus size={14} />
                  Добавить надбавку
                </button>
              </div>

              {/* Gross estimate */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-50/40 border border-blue-200 rounded-xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Wallet size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Расчётный Gross (UI-оценка)
                    </p>
                    <p className="text-xs text-blue-400 mt-0.5">Оклад × ставка + активные надбавки</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-700 font-mono">
                  {formatCurrency(estimatedGross)}
                </p>
              </div>
            </SectionCard>

            {/* ── 3. Банковские реквизиты — UI-only ───────────────── */}
            <SectionCard
              title="Банковские реквизиты"
              subtitle="Данные для перечисления зарплаты"
              action={<UiOnlyBadge />}
            >
              <div className="grid grid-cols-2 gap-x-5 gap-y-5 mb-6">
                <div className="col-span-2">
                  <FieldGroup label="ИИК (банковский счёт)">
                    <input className={`${inputCls} font-mono`} value={form.iik}
                      onChange={(e) => set('iik', e.target.value)} placeholder="KZ56125KZT0000123456" />
                  </FieldGroup>
                </div>
                <FieldGroup label="БИК банка">
                  <input className={`${inputCls} font-mono`} value={form.bik}
                    onChange={(e) => set('bik', e.target.value)} placeholder="HSBKKZKX" />
                </FieldGroup>
                <FieldGroup label="Наименование банка">
                  <input className={inputCls} value={form.bankName}
                    onChange={(e) => set('bankName', e.target.value)} placeholder="Народный Банк Казахстана" />
                </FieldGroup>
                <div className="col-span-2">
                  <FieldGroup label="Номер счёта ЕНПФ">
                    <input className={`${inputCls} font-mono`} value={form.enpfAccount}
                      onChange={(e) => set('enpfAccount', e.target.value)} placeholder="NP-880415-350283" />
                  </FieldGroup>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <SubSection label="Налоговые вычеты" />
                  <UiOnlyBadge />
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                  <FieldGroup label="Стандартный вычет (₸)" hint="МЗП × 14 = 42 500 ₸ в 2026 г.">
                    <div className="relative">
                      <input type="number" className={`${inputCls} pr-7`}
                        value={form.standardDeduction} placeholder="42500"
                        onChange={(e) => set('standardDeduction', e.target.value)} min={0} step={500} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₸</span>
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Дополнительный вычет (₸)" hint="Иждивенцы, ипотека и т.д.">
                    <div className="relative">
                      <input type="number" className={`${inputCls} pr-7`}
                        value={form.additionalDeduction} placeholder="0"
                        onChange={(e) => set('additionalDeduction', e.target.value)} min={0} step={500} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₸</span>
                    </div>
                  </FieldGroup>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ══════════════ RIGHT COLUMN ══════════════ */}
          <div className="flex flex-col gap-6">

            {/* ── 4. Табель ─────────────────────────── */}
            <SectionCard
              title={`Табель — ${periodToLabel(tabPeriod)}`}
              action={
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Изменить месяц
                </button>
              }
            >
              {/* Дни — UI-only */}
              <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-600 font-medium">
                <Info size={11} />
                <span>Дни табеля — только UI</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Рабочих',    key: 'workDays'     as const, color: 'text-gray-900' },
                  { label: 'Больничных', key: 'sickDays'     as const, color: 'text-amber-600' },
                  { label: 'Отпускных',  key: 'vacationDays' as const, color: 'text-blue-600' },
                ].map(({ label, key, color }) => (
                  <div key={key} className="flex flex-col items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl py-3 px-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center leading-tight">
                      {label}
                    </p>
                    <input
                      type="number"
                      className={`w-full text-center text-xl font-bold ${color} bg-transparent border-none outline-none focus:ring-0 p-0`}
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      min={0}
                      max={31}
                    />
                    <p className="text-[10px] text-gray-400">дней</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-5 text-sm text-gray-600">
                <Clock size={14} className="text-gray-400 shrink-0" />
                <span>
                  Фактически отработано:{' '}
                  <span className="font-semibold text-gray-900">{form.workDays} дней</span>
                </span>
              </div>

              {/* payroll summary — реальные данные если есть, иначе empty state */}
              {latestPayroll ? (
                <>
                  <div className="rounded-xl p-4 mb-4 border bg-gray-50 border-gray-200">
                    <SummaryRow label="Gross"     value={formatCurrency(latestPayroll.totalAccrued)} />
                    <SummaryRow label="Удержания" value={`− ${formatCurrency(latestPayroll.totalDeductions)}`} variant="negative" />
                    <SummaryRow label="К выдаче"  value={formatCurrency(latestPayroll.netPay)} variant="positive" large />
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-4">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400" />
                    <span className="text-gray-400">
                      {PAYROLL_STATUS_LABEL[latestPayroll.status]} · {periodToLabel(latestPayroll.period)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="rounded-xl p-4 mb-4 border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center gap-2 py-6">
                  <TrendingDown size={20} className="text-gray-300" />
                  <p className="text-xs text-gray-400 text-center">Нет данных о начислениях</p>
                  <p className="text-xs text-gray-400 text-center">Запустите расчёт в модуле Зарплата</p>
                </div>
              )}

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Открыть в модуле Зарплата
                <ChevronRight size={14} />
              </button>
            </SectionCard>

            {/* ── 5. История начислений ─────────────── */}
            <SectionCard
              title="История начислений"
              subtitle="Из модуля Зарплата"
            >
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2 text-center">
                  <TrendingDown size={24} className="text-gray-300" />
                  <p className="text-sm text-gray-400">Нет данных о начислениях</p>
                  <p className="text-xs text-gray-400">
                    Запустите расчёт в модуле Зарплата
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  {history.map((item) => (
                    <HistoryItem key={item.id} item={item} />
                  ))}
                </div>
              )}

              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Показать все
                <ChevronRight size={13} />
              </button>
            </SectionCard>

          </div>
        </div>

        {/* ── bottom save bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 size={15} className="text-gray-400" />
            Сохраняются только: ФИО, ИИН, Должность, Подразделение, Базовый оклад
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {saving
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save size={14} />
              }
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
