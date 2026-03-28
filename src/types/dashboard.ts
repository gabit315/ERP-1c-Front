export type OperationType = 'income' | 'expense' | 'transfer'

export interface DashboardOperation {
  id: string | number
  date: string
  description: string
  amount: number
  type: OperationType
}

export interface DashboardData {
  total_balance: number
  monthly_income: number
  monthly_expenses: number
  accounts_receivable: number
  receivables_count?: number
  balance_trend_percent?: number
  income_trend_percent?: number
  expenses_trend_percent?: number
  recent_operations: DashboardOperation[]
}

export interface HealthData {
  status: string
}
