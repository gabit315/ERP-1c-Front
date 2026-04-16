// ─── payroll domain types ──────────────────────────────────────────────────

/**
 * Статусы из backend (GET /api/payroll):
 *   calculated     → рассчитано, ещё не проведено
 *   processing     → проведено (бухгалтерские проводки созданы)
 *   paid           → выплачено
 *   not_calculated → frontend-only: сотрудник есть, но payroll за этот месяц не создан
 */
export type PayrollStatus = 'calculated' | 'processing' | 'paid' | 'not_calculated'

// Config for a single allowance (percent or fixed amount)
export interface AllowanceConfig {
  id: string
  label: string
  type: 'percent' | 'fixed'
  value: number      // percent (e.g. 30) or fixed amount in tenge (e.g. 8000)
  enabled: boolean
}

// Row in the payroll list table — merged from employees + payroll API
export interface PayrollListItem {
  payrollId?:     string  // id из payroll_calculations; отсутствует если нет записи
  employeeId:     number
  fullName:       string
  position:       string
  department:     string
  iin:            string
  baseSalary:     number
  allowancesTotal: number
  gross:          number  // totalAccrued из API; 0 если нет записи
  deductions:     number  // totalDeductions из API; 0 если нет записи
  netSalary:      number  // netPay из API; 0 если нет записи
  status:         PayrollStatus
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
