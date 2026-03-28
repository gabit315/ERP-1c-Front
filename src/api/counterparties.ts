import { apiFetch } from './client'

// ─── raw API types ────────────────────────────────────────────────────────────

interface ApiCounterparty {
  id: number
  name: string
  bin_iin: string | null
  counterparty_type: 'supplier' | 'buyer'
  contact: string | null
  deleted_at: string | null
}

// ─── frontend model ───────────────────────────────────────────────────────────

export interface Counterparty {
  id: number
  name: string
  binIin: string | null
  type: 'supplier' | 'buyer'
  contact: string | null
}

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapCounterparty(c: ApiCounterparty): Counterparty {
  return {
    id: c.id,
    name: c.name,
    binIin: c.bin_iin,
    type: c.counterparty_type,
    contact: c.contact,
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getCounterparties(): Promise<Counterparty[]> {
  const raw = await apiFetch<ApiCounterparty[]>('/api/counterparties')
  return raw
    .filter((c) => c.deleted_at == null)
    .map(mapCounterparty)
}
