import { apiFetch } from './client'

// ─── GET /api/operations ──────────────────────────────────────────────────────

interface ApiOperationItem {
  id: number
  operation_date: string
  number: string
  description: string
  entries?: unknown[]
  entries_count?: number
}

export interface OperationItem {
  id: number
  date: string      // formatted DD.MM.YYYY, fallback '—'
  dateRaw: string   // ISO string for period filtering
  number: string
  description: string
  entriesCount: number
}

function parseDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d ?? '')
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '—'
}

function mapOperationItem(op: ApiOperationItem): OperationItem {
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
  }
}

export async function getOperations(): Promise<OperationItem[]> {
  const raw = await apiFetch<ApiOperationItem[]>('/api/operations')
  return raw.map(mapOperationItem)
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

// ─── public API ──────────────────────────────────────────────────────────────

export async function createOperation(payload: CreateOperationPayload): Promise<void> {
  const BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'
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
  const BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'
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
