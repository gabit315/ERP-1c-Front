import { apiFetch } from './client'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── raw API types ────────────────────────────────────────────────────────────

interface ApiCounterparty {
  id: number
  name: string
  bin_iin: string | null
  counterparty_type: 'supplier' | 'buyer'
  contact: string | null
  notes: string | null
  deleted_at: string | null
}

// ─── frontend model ───────────────────────────────────────────────────────────

export interface Counterparty {
  id: number
  name: string
  binIin: string | null
  type: 'supplier' | 'buyer'
  contact: string | null
  notes: string | null
}

// ─── payloads ────────────────────────────────────────────────────────────────

export interface CounterpartyPayload {
  name: string
  bin_iin: string | null
  counterparty_type: 'supplier' | 'buyer'
  contact: string | null
  notes: string | null
}

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapCounterparty(c: ApiCounterparty): Counterparty {
  return {
    id: c.id,
    name: c.name,
    binIin: c.bin_iin,
    type: c.counterparty_type,
    contact: c.contact,
    notes: c.notes,
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

export async function getCounterparties(): Promise<Counterparty[]> {
  const raw = await apiFetch<ApiCounterparty[]>('/api/counterparties')
  return raw
    .filter((c) => c.deleted_at == null)
    .map(mapCounterparty)
}

export async function createCounterparty(payload: CounterpartyPayload): Promise<void> {
  await mutate('/api/counterparties', 'POST', payload)
}

export async function updateCounterparty(id: number, payload: CounterpartyPayload): Promise<void> {
  await mutate(`/api/counterparties/${id}`, 'PUT', payload)
}

export async function deleteCounterparty(id: number): Promise<void> {
  await mutate(`/api/counterparties/${id}`, 'DELETE')
}

