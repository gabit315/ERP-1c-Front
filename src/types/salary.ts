// ─── payroll domain types ──────────────────────────────────────────────────

export type PayrollStatus = 'draft' | 'calculated' | 'posted'

// Config for a single allowance (percent or fixed amount)
export interface AllowanceConfig {
  id: string
  label: string
  type: 'percent' | 'fixed'
  value: number      // percent (e.g. 30) or fixed amount in tenge (e.g. 8000)
  enabled: boolean
}

// Row in the payroll list table
export interface PayrollListItem {
  employeeId: number
  fullName: string
  position: string
  department: string
  iin: string
  baseSalary: number
  allowancesTotal: number
  gross: number
  deductions: number
  netSalary: number
  status: PayrollStatus
}

// Per-allowance breakdown for the detail page
export interface AllowanceBreakdown {
  id: string
  label: string
  amount: number
  percent: number
  enabled: boolean
}

// Full payroll calculation result for one employee
export interface PayrollCalculationResult {
  baseSalary: number
  allowanceBreakdown: AllowanceBreakdown[]
  allowancesTotal: number
  gross: number
  opv: number           // ОПВ — пенсионные взносы (10%)
  osms: number          // ОСМС работника (2%)
  taxableIncome: number
  iit: number           // ИПН (10%)
  deductions: number    // all deductions total
  netSalary: number
  employerSO: number    // Социальные отчисления работодателя
  employerOSMS: number  // ОСМС работодателя
  totalCompanyCost: number
}
