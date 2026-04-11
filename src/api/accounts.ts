import { apiFetch } from './client'

// ─── raw API types ────────────────────────────────────────────────────────────

interface ApiAccount {
  code: string
  name: string
  account_type: 'active' | 'passive'
  kind: string
  is_active: boolean
  balance_amount: number | null
  balance_side: 'debit' | 'credit' | null
}

interface ApiMovement {
  entry_id: number
  date: string
  operation_number: string
  description: string
  counterparty_name: string | null
  item_name: string | null
  debit: number | null
  credit: number | null
  balance_amount: number
  balance_side: string
}

interface ApiAnalysis {
  account: { code: string; name: string; account_type: string }
  date_from: string
  date_to: string
  summary: {
    opening_balance_amount: number
    opening_balance_side: string | null
    turnover_debit: number
    turnover_credit: number
    closing_balance_amount: number
    closing_balance_side: string | null
  }
  movements: ApiMovement[]
}

// ─── frontend model types ─────────────────────────────────────────────────────

export interface Account {
  code: string
  name: string
  accountType: 'active' | 'passive' | 'active-passive'
  isActive: boolean
  balanceAmount: number | null
  balanceSide: 'debit' | 'credit' | null
}

export interface Movement {
  entryId: number
  date: string
  operationNumber: string
  description: string
  counterpartyName: string | null
  itemName: string | null
  debit: number | null
  credit: number | null
  balanceAmount: number
  balanceSide: string
}

export interface AccountAnalysis {
  account: { code: string; name: string; accountType: string }
  dateFrom: string
  dateTo: string
  summary: {
    openingBalanceAmount: number
    openingBalanceSide: string | null
    turnoverDebit: number
    turnoverCredit: number
    closingBalanceAmount: number
    closingBalanceSide: string | null
  }
  movements: Movement[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (d ?? '—')
}

// ─── mappers ─────────────────────────────────────────────────────────────────

function mapAccount(a: ApiAccount): Account {
  return {
    code: a.code,
    name: a.name,
    accountType: a.account_type,
    isActive: a.is_active,
    balanceAmount: a.balance_amount,
    balanceSide: a.balance_side,
  }
}

function mapAnalysis(a: ApiAnalysis): AccountAnalysis {
  return {
    account: { code: a.account.code, name: a.account.name, accountType: a.account.account_type },
    dateFrom: parseDate(a.date_from),
    dateTo: parseDate(a.date_to),
    summary: {
      openingBalanceAmount: a.summary.opening_balance_amount ?? 0,
      openingBalanceSide: a.summary.opening_balance_side,
      turnoverDebit: a.summary.turnover_debit ?? 0,
      turnoverCredit: a.summary.turnover_credit ?? 0,
      closingBalanceAmount: a.summary.closing_balance_amount ?? 0,
      closingBalanceSide: a.summary.closing_balance_side,
    },
    movements: (a.movements ?? []).map((m) => ({
      entryId: m.entry_id,
      date: parseDate(m.date),
      operationNumber: m.operation_number,
      description: m.description,
      counterpartyName: m.counterparty_name,
      itemName: m.item_name,
      debit: m.debit,
      credit: m.credit,
      balanceAmount: m.balance_amount,
      balanceSide: m.balance_side,
    })),
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const raw = await apiFetch<ApiAccount[]>('/api/accounts')
  return raw.map(mapAccount)
}

export async function getAccountAnalysis(
  code: string,
  dateFrom: string,
  dateTo: string,
): Promise<AccountAnalysis> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
  const raw = await apiFetch<ApiAnalysis>(
    `/api/reports/accounts/${encodeURIComponent(code)}/analysis?${params}`
  )
  return mapAnalysis(raw)
}
