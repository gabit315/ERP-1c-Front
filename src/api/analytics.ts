import { apiFetch } from './client'

// ─── raw API types ────────────────────────────────────────────────────────────

interface ApiLinePoint {
  label: string
  income: number
  expense: number
}

interface ApiExpenseSlice {
  label: string
  amount: number
  pct: number
}

interface ApiQuarterPoint {
  label: string
  value: number
}

interface ApiInsights {
  income_growth_pct: number
  biggest_expense_category: string
  average_margin_pct: number
}

interface ApiAnalytics {
  line_chart: ApiLinePoint[]
  expense_distribution: ApiExpenseSlice[]
  quarterly_income: ApiQuarterPoint[]
  insights: ApiInsights
}

// ─── frontend model ───────────────────────────────────────────────────────────

export interface LinePoint {
  label: string
  income: number   // in millions (÷ 1_000_000)
  expense: number
}

export interface ExpenseSlice {
  label: string
  amount: number
  pct: number      // 0–100, integer
}

export interface QuarterPoint {
  label: string
  value: number    // in millions
}

export interface AnalyticsInsights {
  incomeGrowthPct: number
  biggestExpenseCategory: string
  biggestExpensePct: number    // looked up from expense_distribution
  averageMarginPct: number
}

export interface AnalyticsData {
  lineChart: LinePoint[]
  expenseDistribution: ExpenseSlice[]
  quarterlyIncome: QuarterPoint[]
  insights: AnalyticsInsights
}

// ─── period mapping ───────────────────────────────────────────────────────────

export const PERIOD_LABELS = [
  'Последние 6 месяцев',
  'Текущий год',
  'Прошлый год',
  'Все время',
] as const

export type PeriodLabel = (typeof PERIOD_LABELS)[number]

const PERIOD_PARAM: Record<PeriodLabel, string> = {
  'Последние 6 месяцев': 'last_6_months',
  'Текущий год':         'current_year',
  'Прошлый год':         'last_year',
  'Все время':           'all_time',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function safeNum(v: number | null | undefined): number {
  if (v == null || !isFinite(v)) return 0
  return v
}

const M = 1_000_000

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapAnalytics(raw: ApiAnalytics): AnalyticsData {
  const lineChart: LinePoint[] = (raw.line_chart ?? []).map((p) => ({
    label:   p.label || '—',
    income:  safeNum(p.income)  / M,
    expense: safeNum(p.expense) / M,
  }))

  const expenseDistribution: ExpenseSlice[] = (raw.expense_distribution ?? []).map((s) => ({
    label:  s.label || '—',
    amount: safeNum(s.amount),
    pct:    Math.round(safeNum(s.pct)),
  }))

  const quarterlyIncome: QuarterPoint[] = (raw.quarterly_income ?? []).map((q) => ({
    label: q.label || '—',
    value: safeNum(q.value) / M,
  }))

  const ins = raw.insights ?? {}
  const biggestCat = ins.biggest_expense_category || '—'
  const biggestSlice = expenseDistribution.find((s) => s.label === biggestCat)

  const insights: AnalyticsInsights = {
    incomeGrowthPct:        Math.round(safeNum(ins.income_growth_pct)   * 10) / 10,
    biggestExpenseCategory: biggestCat,
    biggestExpensePct:      biggestSlice?.pct ?? Math.round(safeNum((raw.expense_distribution ?? []).find(s => s.label === biggestCat)?.pct)),
    averageMarginPct:       Math.round(safeNum(ins.average_margin_pct)  * 10) / 10,
  }

  return { lineChart, expenseDistribution, quarterlyIncome, insights }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getAnalytics(period: PeriodLabel): Promise<AnalyticsData> {
  const param = PERIOD_PARAM[period]
  const raw = await apiFetch<ApiAnalytics>(`/api/analytics?period=${encodeURIComponent(param)}`)
  return mapAnalytics(raw)
}
