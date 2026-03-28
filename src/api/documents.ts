const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── request types ────────────────────────────────────────────────────────────

export interface CreateDocumentPayload {
  document_type: 'income' | 'expense' | 'payment'
  document_date: string
  amount: number
  counterparty_id?: number  // income / payment
  item_id?: number          // expense
  purpose?: string
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
    throw new Error(`Ошибка сервера: ${res.status}`)
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
