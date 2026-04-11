const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── GET /api/documents ───────────────────────────────────────────────────────

export interface DocumentItem {
  id: number
  number: string
  document_type: 'income' | 'expense' | 'payment'
  document_date: string
  amount: number
  purpose?: string
  status: 'posted' | 'draft'
  is_posted: boolean
  is_draft: boolean
  counterparty_id?: number | null
  counterparty_name?: string | null
  item_id?: number | null
  item_name?: string | null
  operation_id?: number | null
  operation_number?: string | null
  posted_at?: string | null
  source_filename?: string | null
  mime_type?: string | null
  created_at: string
  updated_at: string
}

export interface DocumentsQueryParams {
  query?: string
  counterparty_id?: number
  /** Filter by status: 'posted' | 'draft' */
  status?: 'posted' | 'draft'
  document_type?: 'income' | 'expense' | 'payment'
  date_from?: string
  date_to?: string
}

function buildQS(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function getDocuments(params?: DocumentsQueryParams): Promise<DocumentItem[]> {
  const qs = params ? buildQS(params) : ''
  const res = await fetch(`${BASE_URL}/api/documents${qs}`)
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`)
  return res.json() as Promise<DocumentItem[]>
}

// ─── GET /api/documents/summary ──────────────────────────────────────────────

export interface DocumentsSummaryTab {
  key: 'posted' | 'draft'
  label: string
  count: number
}

export interface DocumentsSummary {
  total_count: number
  posted_count: number
  draft_count: number
  posted_total_amount: number
  draft_total_amount: number
  currency: string
  tabs: DocumentsSummaryTab[]
  last_recalculated_at: string
}

export async function getDocumentsSummary(params?: DocumentsQueryParams): Promise<DocumentsSummary> {
  const qs = params ? buildQS(params) : ''
  const res = await fetch(`${BASE_URL}/api/documents/summary${qs}`)
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`)
  return res.json() as Promise<DocumentsSummary>
}

// ─── request types ────────────────────────────────────────────────────────────

export interface CreateDocumentPayload {
  document_type: 'income' | 'expense' | 'payment'
  document_date: string
  amount: number
  counterparty_id?: number
  item_id?: number
  purpose?: string
  number?: string
  payment_account_code?: string
  source_filename?: string
  mime_type?: string
  /** 'posted' to finalize, 'draft' to save as draft */
  status: 'posted' | 'draft'
}

// ─── response types ───────────────────────────────────────────────────────────

export interface AnalyzeDocumentResult {
  document_type?: 'income' | 'expense' | 'payment'
  document_date?: string
  amount?: number
  counterparty_id?: number
  counterparty_name?: string
  item_id?: number
  purpose?: string
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function createDocument(payload: CreateDocumentPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let message = `Ошибка сервера: ${res.status}`
    try {
      const err = (await res.json()) as { detail?: string }
      if (err.detail) message = err.detail
    } catch { /* ignore */ }
    throw new Error(message)
  }
}

export async function analyzeDocument(file: File): Promise<AnalyzeDocumentResult> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE_URL}/api/documents/analyze`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    throw new Error(`Ошибка сервера: ${res.status}`)
  }
  return res.json() as Promise<AnalyzeDocumentResult>
}
