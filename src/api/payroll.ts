const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── types ────────────────────────────────────────────────────────────────────

/** Статусы из backend: calculated → processing → paid */
export type PayrollStatus = 'calculated' | 'processing' | 'paid'

export interface PayrollHistoryItem {
  id: string
  period: string           // "YYYY-MM"
  totalAccrued: number     // gross
  totalDeductions: number
  netPay: number
  status: PayrollStatus
}

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

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Последние N месяцев в формате YYYY-MM, от текущего к прошлым */
function lastNMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    )
  }
  return months
}

// ─── mutation helpers ─────────────────────────────────────────────────────────

async function payrollMutate(url: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    let message = `Ошибка сервера: ${res.status}`
    try {
      const data = (await res.json()) as { detail?: string }
      if (data.detail) message = data.detail
    } catch { /* ignore */ }
    throw new Error(message)
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * POST /api/payroll/calculate
 * Запускает расчёт зарплаты для указанных сотрудников за период.
 * Если employeeIds пустой — backend рассчитывает всех.
 */
export async function calculatePayroll(period: string, employeeIds: number[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/payroll/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period, employeeIds }),
  })
  if (!res.ok) {
    let message = `Ошибка сервера: ${res.status}`
    try {
      const data = (await res.json()) as { detail?: string }
      if (data.detail) message = data.detail
    } catch { /* ignore */ }
    throw new Error(message)
  }
}

/**
 * POST /api/payroll/{payroll_id}/post
 * Проводит начисление (создаёт бухгалтерские проводки).
 */
export async function postPayroll(payrollId: string): Promise<void> {
  await payrollMutate(`/api/payroll/${payrollId}/post`)
}


export async function payPayroll(payrollId: number): Promise<void> {
  await payrollMutate(`/api/payroll/${payrollId}/pay`)
}

/**
 * Загружает начисления сотрудника за конкретный период.
 * Возвращает null если за этот период расчётов нет или запрос не удался.
 */
export async function getEmployeePayrollForPeriod(
  employeeId: number,
  period: string,
): Promise<PayrollHistoryItem | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/payroll/?employee_id=${employeeId}&period=${period}`,
    )
    if (!res.ok) return null
    const json = (await res.json()) as ApiPayrollListResponse
    const item = json.data[0]
    if (!item) return null
    return {
      id:             item.id,
      period:         item.period,
      totalAccrued:   item.totalAccrued   ?? 0,
      totalDeductions:item.totalDeductions ?? 0,
      netPay:         item.netPay          ?? 0,
      status:         item.status as PayrollStatus,
    }
  } catch {
    return null
  }
}

/**
 * Загружает историю начислений за последние 6 месяцев параллельно.
 * Возвращает только те периоды, для которых есть данные.
 */
export async function getEmployeePayrollHistory(
  employeeId: number,
): Promise<PayrollHistoryItem[]> {
  const periods = lastNMonths(6)
  const results = await Promise.all(
    periods.map((p) => getEmployeePayrollForPeriod(employeeId, p)),
  )
  return results.filter((r): r is PayrollHistoryItem => r !== null)
}
