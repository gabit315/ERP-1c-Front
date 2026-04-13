/**
 * payrollService — abstraction layer over the employees API + mock payroll data.
 *
 * When a real payroll backend is ready:
 *   - replace `getPayrollList()` to call `GET /api/payroll?month=...`
 *   - replace `getEmployeeForPayroll()` to call `GET /api/payroll/{id}`
 *   - remove the mock helpers below
 */

import { getEmployees } from '../api/employees'
import type { Employee } from '../api/employees'
import type { PayrollListItem, PayrollStatus } from '../types/salary'
import { calculatePayroll, DEFAULT_ALLOWANCES } from '../utils/salaryCalculations'

// ─── mock payroll data ────────────────────────────────────────────────────────

// Deterministic: same employee always gets the same salary so UI is consistent
const MOCK_SALARIES = [
  250_000, 320_000, 410_000, 180_000, 290_000,
  350_000, 220_000, 475_000, 310_000, 260_000,
]
const MOCK_STATUSES: PayrollStatus[] = [
  'draft', 'calculated', 'posted', 'draft', 'calculated',
]

function mockBaseSalary(employeeId: number): number {
  return MOCK_SALARIES[employeeId % MOCK_SALARIES.length]
}

function mockStatus(employeeId: number): PayrollStatus {
  return MOCK_STATUSES[employeeId % MOCK_STATUSES.length]
}

// ─── mapper: Employee → PayrollListItem ───────────────────────────────────────

function toPayrollListItem(employee: Employee): PayrollListItem {
  const baseSalary = mockBaseSalary(employee.id)
  const calc = calculatePayroll(baseSalary, DEFAULT_ALLOWANCES)

  return {
    employeeId: employee.id,
    fullName: employee.fullName,
    position: employee.position,
    department: employee.department,
    iin: employee.iin,
    baseSalary,
    allowancesTotal: calc.allowancesTotal,
    gross: calc.gross,
    deductions: calc.deductions,
    netSalary: calc.netSalary,
    status: mockStatus(employee.id),
  }
}

// ─── public service API ───────────────────────────────────────────────────────

/** Returns payroll list for the given month. Month param is ready for future API use. */
export async function getPayrollList(_month?: string): Promise<PayrollListItem[]> {
  const employees = await getEmployees()
  return employees.map(toPayrollListItem)
}

/** Returns a single employee record for the detail/calculation page. */
export async function getEmployeeForPayroll(employeeId: number): Promise<Employee | null> {
  const employees = await getEmployees()
  return employees.find((e) => e.id === employeeId) ?? null
}

/** Returns the mock base salary for an employee (frontend-only, replace with API later). */
export function getBaseSalary(employeeId: number): number {
  return mockBaseSalary(employeeId)
}
