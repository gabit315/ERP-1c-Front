import { apiFetch } from './client'
import type { HealthData, DashboardData, OperationType } from '../types/dashboard'

// ─── raw API response types ───────────────────────────────────────────────────

interface ApiKpiValue {
  value: number
  trend_pct?: number
  side?: string
}

interface ApiOperationEntry {
  debit_account_code: string
  credit_account_code: string
  amount: number
}

interface ApiOperation {
  id: number
  operation_date: string
  description: string
  total_amount: number
  entries: ApiOperationEntry[]
}

interface ApiDashboard {
  period: { month: string; date: string }
  kpis: {
    cash_balance: ApiKpiValue
    income: ApiKpiValue
    expenses: ApiKpiValue
    receivables: ApiKpiValue
  }
  recent_operations: ApiOperation[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toNumber(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Determine operation type from journal entry account codes.
 * Kazakhstan chart of accounts (IFRS-based):
 *   6xxx = Revenue  →  credit 6xxx means income recognised
 *   7xxx / 8xxx = Expenses  →  debit 7xxx/8xxx means expense
 *   2xxx / 3xxx debit + 1xxx credit = paying off a payable → treat as expense
 */
function inferType(entries: ApiOperationEntry[]): OperationType {
  const first = entries?.[0]
  if (!first) return 'transfer'
  const dr = first.debit_account_code ?? ''
  const cr = first.credit_account_code ?? ''
  if (cr.startsWith('6')) return 'income'
  if (dr.startsWith('7') || dr.startsWith('8')) return 'expense'
  if (dr.startsWith('2') || dr.startsWith('3')) return 'expense'
  return 'transfer'
}

// ─── mapper: backend shape → frontend model ───────────────────────────────────

function mapDashboard(api: ApiDashboard): DashboardData {
  return {
    total_balance: toNumber(api.kpis?.cash_balance?.value),
    monthly_income: toNumber(api.kpis?.income?.value),
    monthly_expenses: toNumber(api.kpis?.expenses?.value),
    accounts_receivable: toNumber(api.kpis?.receivables?.value),
    balance_trend_percent: api.kpis?.cash_balance?.trend_pct,
    income_trend_percent: api.kpis?.income?.trend_pct,
    expenses_trend_percent: api.kpis?.expenses?.trend_pct,
    recent_operations: (api.recent_operations ?? []).map((op) => ({
      id: op.id,
      date: op.operation_date ?? '',
      description: op.description ?? '',
      amount: toNumber(op.total_amount),
      type: inferType(op.entries ?? []),
    })),
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<HealthData> {
  return apiFetch<HealthData>('/api/health')
}

export async function getDashboard(): Promise<DashboardData> {
  const raw = await apiFetch<ApiDashboard>('/api/dashboard')
  return mapDashboard(raw)
}
