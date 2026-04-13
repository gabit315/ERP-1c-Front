import type { AllowanceConfig, AllowanceBreakdown, PayrollCalculationResult } from '../types/salary'

// ─── Kazakhstan payroll tax rates (2024) ─────────────────────────────────────

export const TAX_RATES = {
  OPV: 0.10,            // ОПВ — пенсионные взносы работника
  OSMS_EMPLOYEE: 0.02,  // ОСМС работника
  IIT: 0.10,            // ИПН
  EMPLOYER_SO: 0.035,   // Социальные отчисления работодателя
  EMPLOYER_OSMS: 0.03,  // ОСМС работодателя
} as const

// ─── default allowance configs ────────────────────────────────────────────────

export const DEFAULT_ALLOWANCES: AllowanceConfig[] = [
  {
    id: 'pedagogical',
    label: 'Педагогическая надбавка',
    type: 'percent',
    value: 30,
    enabled: false,
  },
  {
    id: 'class_management',
    label: 'Классное руководство',
    type: 'fixed',
    value: 8000,
    enabled: false,
  },
  {
    id: 'rural',
    label: 'Надбавка сельской местности',
    type: 'percent',
    value: 25,
    enabled: false,
  },
]

// ─── calculation functions ────────────────────────────────────────────────────

/** Computes amount and effective percent for every allowance */
export function calculateAllowances(
  baseSalary: number,
  allowances: AllowanceConfig[],
): AllowanceBreakdown[] {
  return allowances.map((a) => {
    const amount =
      a.type === 'percent' ? Math.round((baseSalary * a.value) / 100) : a.value
    const percent =
      a.type === 'percent'
        ? a.value
        : baseSalary > 0
          ? Math.round((a.value / baseSalary) * 1000) / 10
          : 0
    return { id: a.id, label: a.label, amount, percent, enabled: a.enabled }
  })
}

/** Full payroll calculation for one employee */
export function calculatePayroll(
  baseSalary: number,
  allowances: AllowanceConfig[],
): PayrollCalculationResult {
  const allowanceBreakdown = calculateAllowances(baseSalary, allowances)
  const allowancesTotal = allowanceBreakdown
    .filter((a) => a.enabled)
    .reduce((sum, a) => sum + a.amount, 0)

  const gross = baseSalary + allowancesTotal

  const opv = Math.round(gross * TAX_RATES.OPV)
  const osms = Math.round(gross * TAX_RATES.OSMS_EMPLOYEE)
  const taxableIncome = Math.max(0, gross - opv)
  const iit = Math.round(taxableIncome * TAX_RATES.IIT)
  const deductions = opv + osms + iit
  const netSalary = gross - deductions

  const employerSO = Math.round((gross - opv) * TAX_RATES.EMPLOYER_SO)
  const employerOSMS = Math.round(gross * TAX_RATES.EMPLOYER_OSMS)
  const totalCompanyCost = gross + employerSO + employerOSMS

  return {
    baseSalary,
    allowanceBreakdown,
    allowancesTotal,
    gross,
    opv,
    osms,
    taxableIncome,
    iit,
    deductions,
    netSalary,
    employerSO,
    employerOSMS,
    totalCompanyCost,
  }
}

// ─── formatting helpers ───────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('ru-KZ', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' ₸'
  )
}
