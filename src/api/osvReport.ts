import { apiFetch } from './client'

// ─── raw API types ────────────────────────────────────────────────────────────
// Actual response shape from GET /api/reports/trial-balance:
// {
//   date_from: string,
//   date_to: string,
//   rows: ApiTrialBalanceRow[],
//   totals?: ApiTrialBalanceTotals
// }

interface ApiTrialBalanceRow {
  code: string
  name: string
  account_type: string
  kind: string
  opening_debit: number | null
  opening_credit: number | null
  turnover_debit: number | null
  turnover_credit: number | null
  closing_debit: number | null
  closing_credit: number | null
}

interface ApiTrialBalanceTotals {
  opening_debit?: number | null
  opening_credit?: number | null
  turnover_debit?: number | null
  turnover_credit?: number | null
  closing_debit?: number | null
  closing_credit?: number | null
}

interface ApiTrialBalanceResponse {
  date_from: string
  date_to: string
  rows: ApiTrialBalanceRow[]
  totals?: ApiTrialBalanceTotals
}

// ─── frontend model ───────────────────────────────────────────────────────────

export interface TrialBalanceRow {
  code: string
  name: string
  openD: number | null
  openC: number | null
  turnD: number | null
  turnC: number | null
  closeD: number | null
  closeC: number | null
}

export interface TrialBalanceTotals {
  openD: number | null
  openC: number | null
  turnD: number | null
  turnC: number | null
  closeD: number | null
  closeC: number | null
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[]
  totals: TrialBalanceTotals | null
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function safeNum(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v)) return null
  return v === 0 ? null : v
}

function mapRow(r: ApiTrialBalanceRow): TrialBalanceRow {
  return {
    code:   r.code || '—',
    name:   r.name || '—',
    openD:  safeNum(r.opening_debit),
    openC:  safeNum(r.opening_credit),
    turnD:  safeNum(r.turnover_debit),
    turnC:  safeNum(r.turnover_credit),
    closeD: safeNum(r.closing_debit),
    closeC: safeNum(r.closing_credit),
  }
}

function mapTotals(t: ApiTrialBalanceTotals): TrialBalanceTotals {
  return {
    openD:  safeNum(t.opening_debit),
    openC:  safeNum(t.opening_credit),
    turnD:  safeNum(t.turnover_debit),
    turnC:  safeNum(t.turnover_credit),
    closeD: safeNum(t.closing_debit),
    closeC: safeNum(t.closing_credit),
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getTrialBalance(
  dateFrom: string,
  dateTo: string
): Promise<TrialBalanceReport> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
  const raw = await apiFetch<ApiTrialBalanceResponse>(
    `/api/reports/trial-balance?${params}`
  )

  return {
    rows:   (raw.rows ?? []).map(mapRow),
    totals: raw.totals ? mapTotals(raw.totals) : null,
  }
}
