import { apiFetch } from '../api/client'
import { getEmployees, getEmployee } from '../api/employees'
import type { Employee } from '../api/employees'
import type { PayrollListItem, PayrollStatus } from '../types/salary'

// ─── raw API types ─────────────────────────────────────────────────────────────

interface ApiPayrollListItem {
  id: string
  employeeId: string
  employeeName: string
  position: string
  baseSalary: number | null
  totalAccrued: number | null
  totalDeductions: number | null
  netPay: number | null
  status: string
  period: string
}

interface ApiPayrollListResponse {
  data: ApiPayrollListItem[]
  period: string
}


// ─── public service API ───────────────────────────────────────────────────────

/**
 * Загружает список сотрудников и payroll за period параллельно,
 * затем делает merge: каждый активный сотрудник попадает в таблицу,
 * даже если payroll_calculations за этот месяц ещё нет.
 */
export async function getPayrollList(period: string): Promise<PayrollListItem[]> {
  const [employees, payrollResponse] = await Promise.all([
    getEmployees(),
    apiFetch<ApiPayrollListResponse>(`/api/payroll/?period=${period}`).catch(() => ({ data: [], period })),
  ])

  // Индекс payroll по employeeId для быстрого поиска
  const payrollByEmployeeId = new Map<number, ApiPayrollListItem>()
  for (const item of payrollResponse.data) {
    payrollByEmployeeId.set(parseInt(item.employeeId), item)
  }

  return employees.map((emp): PayrollListItem => {
    const payroll = payrollByEmployeeId.get(emp.id)

    if (payroll) {
      return {
        payrollId:       payroll.id,
        employeeId:      emp.id,
        fullName:        emp.fullName,
        position:        emp.position,
        department:      emp.department,
        iin:             emp.iin,
        baseSalary:      payroll.baseSalary      ?? emp.baseSalary ?? 0,
        allowancesTotal: 0,
        gross:           payroll.totalAccrued    ?? 0,
        deductions:      payroll.totalDeductions ?? 0,
        netSalary:       payroll.netPay          ?? 0,
        status:          payroll.status as PayrollStatus,
      }
    }

    // Нет payroll-записи за этот период — показываем сотрудника с нулями
    return {
      employeeId:      emp.id,
      fullName:        emp.fullName,
      position:        emp.position,
      department:      emp.department,
      iin:             emp.iin,
      baseSalary:      emp.baseSalary ?? 0,
      allowancesTotal: 0,
      gross:           0,
      deductions:      0,
      netSalary:       0,
      status:          'not_calculated' as PayrollStatus,
    }
  })
}

/** Returns a single employee record for the detail/calculation page. */
export async function getEmployeeForPayroll(employeeId: number): Promise<Employee | null> {
  try {
    return await getEmployee(employeeId)
  } catch {
    return null
  }
}
