import { apiFetch } from './client'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── raw API types ────────────────────────────────────────────────────────────

interface ApiFinancialItem {
  id: number
  name: string
  category: string
  item_type: 'expense' | 'income'
  default_account_code: string | null
  deleted_at: string | null
}

// ─── frontend model ───────────────────────────────────────────────────────────

export interface FinancialItem {
  id: number
  name: string
  category: string
  itemType: 'expense' | 'income'
  defaultAccountCode: string | null
}

// ─── payload ─────────────────────────────────────────────────────────────────

export interface FinancialItemPayload {
  name: string
  category: string
  item_type: 'expense' | 'income'
  default_account_code: string | null
}

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapFinancialItem(item: ApiFinancialItem): FinancialItem {
  return {
    id: item.id,
    name: item.name || '—',
    category: item.category || '—',
    itemType: item.item_type,
    defaultAccountCode: item.default_account_code ?? null,
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function mutate(url: string, method: string, body?: unknown): Promise<void> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let message = `Ошибка сервера: ${res.status}`
    try {
      const data = (await res.json()) as { detail?: string }
      if (data.detail) message = data.detail
    } catch {
      // ignore
    }
    throw new Error(message)
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getFinancialItems(): Promise<FinancialItem[]> {
  const raw = await apiFetch<ApiFinancialItem[]>('/api/financial-items')
  return raw
    .filter((item) => item.deleted_at == null)
    .map(mapFinancialItem)
}

export async function createFinancialItem(payload: FinancialItemPayload): Promise<void> {
  await mutate('/api/financial-items', 'POST', payload)
}

export async function updateFinancialItem(id: number, payload: FinancialItemPayload): Promise<void> {
  await mutate(`/api/financial-items/${id}`, 'PUT', payload)
}

export async function deleteFinancialItem(id: number): Promise<void> {
  await mutate(`/api/financial-items/${id}`, 'DELETE')
}
