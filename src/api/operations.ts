import { apiFetch } from './client'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── GET /api/operations ──────────────────────────────────────────────────────

interface ApiOperationItem {
  id: number
  operation_date: string
  number: string
  description: string
  status?: 'posted' | 'draft'
  is_posted?: boolean
  counterparty_name?: string | null
  total_amount?: number | null
  entries?: unknown[]
  entries_count?: number
}

export interface OperationItem {
  id: number
  date: string           // formatted DD.MM.YYYY, fallback '—'
  dateRaw: string        // ISO string for period filtering
  number: string
  description: string
  entriesCount: number
  status: 'posted' | 'draft'
  isPosted: boolean      // convenience alias: status === 'posted'
  counterpartyName: string
  totalAmount: number
}

function parseDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d ?? '')
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '—'
}

function mapOperationItem(op: ApiOperationItem): OperationItem {
  // Prefer explicit status field; fall back to is_posted for older responses
  const status: 'posted' | 'draft' =
    op.status === 'posted' || op.status === 'draft'
      ? op.status
      : (op.is_posted ?? false)
      ? 'posted'
      : 'draft'

  return {
    id: op.id,
    date: parseDate(op.operation_date),
    dateRaw: op.operation_date ?? '',
    number: op.number || '—',
    description: op.description || '—',
    entriesCount:
      typeof op.entries_count === 'number'
        ? op.entries_count
        : Array.isArray(op.entries)
        ? op.entries.length
        : 0,
    status,
    isPosted: status === 'posted',
    counterpartyName: op.counterparty_name ?? '',
    totalAmount: op.total_amount ?? 0,
  }
}

export interface OperationsQueryParams {
  query?: string
  account_code?: string
  counterparty_id?: number
  /** Filter by status: 'posted' | 'draft' */
  status?: 'posted' | 'draft'
  date_from?: string
  date_to?: string
  limit?: number
}

export async function getOperations(params?: OperationsQueryParams): Promise<OperationItem[]> {
  const qs = params ? buildQS(params) : ''
  const raw = await apiFetch<ApiOperationItem[]>(`/api/operations${qs}`)
  return raw.map(mapOperationItem)
}

// ─── GET /api/operations/summary ─────────────────────────────────────────────

export interface OperationsSummaryTab {
  key: 'posted' | 'draft'
  label: string
  count: number
}

export interface OperationsSummary {
  total_count: number
  posted_count: number
  draft_count: number
  posted_total_amount: number
  draft_total_amount: number
  currency: string
  tabs: OperationsSummaryTab[]
  last_recalculated_at: string
}

export function getOperationsSummary(params?: OperationsQueryParams): Promise<OperationsSummary> {
  const qs = params ? buildQS(params) : ''
  return apiFetch<OperationsSummary>(`/api/operations/summary${qs}`)
}

// ─── GET /api/operations/templates ───────────────────────────────────────────

export interface OperationSystemTemplateEntry {
  line_no: number
  debit_account_code: string
  credit_account_code: string
  comment?: string
}

export interface OperationSystemTemplate {
  id: string
  title: string
  description: string
  category: string
  source: string
  default_status: 'posted' | 'draft'
  counterparty_required: boolean
  employee_required: boolean
  item_hint?: string
  entries: OperationSystemTemplateEntry[]
}

export function getOperationsSystemTemplates(): Promise<OperationSystemTemplate[]> {
  return apiFetch<OperationSystemTemplate[]>('/api/operations/templates')
}

// ─── request types ────────────────────────────────────────────────────────────

export interface EntryPayload {
  debit_account_code: string
  credit_account_code: string
  amount: number
}

export interface CreateOperationPayload {
  operation_date: string
  number: string
  description: string
  counterparty_id?: number | null
  /** Use 'posted' to finalize, 'draft' to save as draft */
  status: 'posted' | 'draft'
  entries: EntryPayload[]
}

// ─── response types ───────────────────────────────────────────────────────────

export interface SuggestedEntry {
  debit_account_code: string
  credit_account_code: string
  amount: number
}

interface SuggestEntriesResponse {
  entries: SuggestedEntry[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildQS(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function createOperation(payload: CreateOperationPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/operations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let message = `Ошибка сервера: ${res.status}`
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) message = body.detail
    } catch {
      // ignore json parse errors
    }
    throw new Error(message)
  }
}

export async function suggestEntries(description: string): Promise<SuggestedEntry[]> {
  const res = await fetch(`${BASE_URL}/api/operations/suggest-entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  if (!res.ok) {
    throw new Error(`Ошибка сервера: ${res.status}`)
  }
  const data = (await res.json()) as SuggestEntriesResponse
  return data.entries ?? []
}
