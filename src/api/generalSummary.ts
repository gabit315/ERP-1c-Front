import { apiFetch } from './client'

// ─── raw API types ────────────────────────────────────────────────────────────
// GET /api/reports/general-summary?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
// {
//   date_from, date_to,
//   totals: { income, expenses, net_profit, cash_balance },
//   monthly: [{ month, month_short, income, expense, profit }],
//   expense_structure: [{ label, amount, pct }]
// }

interface ApiTotals {
  income: number
  expenses: number    // note: plural
  net_profit: number
  cash_balance: number
}

interface ApiMonthItem {
  month: string       // "Март 2026"
  month_short: string // "Мар"
  income: number
  expense: number     // note: singular
  profit: number
}

interface ApiExpenseItem {
  label: string
  amount: number
  pct: number         // 0–100
}

interface ApiGeneralSummary {
  date_from: string
  date_to: string
  totals: ApiTotals
  monthly: ApiMonthItem[]
  expense_structure: ApiExpenseItem[]
}

// ─── frontend model ───────────────────────────────────────────────────────────

export interface SummaryTotals {
  income: number
  expenses: number
  netProfit: number
  cashBalance: number
}

export interface MonthItem {
  month: string
  monthShort: string
  income: number
  expense: number
  profit: number
}

export interface ExpenseItem {
  label: string
  amount: number
  pct: number
}

export interface GeneralSummary {
  dateFrom: string
  dateTo: string
  totals: SummaryTotals
  monthly: MonthItem[]
  expenseStructure: ExpenseItem[]
  expenseTotal: number
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function safeNum(v: number | null | undefined): number {
  if (v == null || !isFinite(v)) return 0
  return v
}

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapSummary(raw: ApiGeneralSummary): GeneralSummary {
  const monthly: MonthItem[] = (raw.monthly ?? []).map((m) => ({
    month:      m.month      || '—',
    monthShort: m.month_short || '—',
    income:  safeNum(m.income),
    expense: safeNum(m.expense),
    profit:  safeNum(m.profit),
  }))

  const expenseStructure: ExpenseItem[] = (raw.expense_structure ?? []).map((e) => ({
    label:  e.label  || '—',
    amount: safeNum(e.amount),
    pct:    Math.round(safeNum(e.pct)),
  }))

  const expenseTotal = expenseStructure.reduce((s, e) => s + e.amount, 0)

  return {
    dateFrom: raw.date_from ?? '',
    dateTo:   raw.date_to   ?? '',
    totals: {
      income:      safeNum(raw.totals?.income),
      expenses:    safeNum(raw.totals?.expenses),
      netProfit:   safeNum(raw.totals?.net_profit),
      cashBalance: safeNum(raw.totals?.cash_balance),
    },
    monthly,
    expenseStructure,
    expenseTotal,
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getGeneralSummary(
  dateFrom: string,
  dateTo: string
): Promise<GeneralSummary> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
  const raw = await apiFetch<ApiGeneralSummary>(`/api/reports/general-summary?${params}`)
  return mapSummary(raw)
}
