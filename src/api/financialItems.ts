import { apiFetch } from './client'

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

// ─── public API ──────────────────────────────────────────────────────────────

export async function getFinancialItems(): Promise<FinancialItem[]> {
  const raw = await apiFetch<ApiFinancialItem[]>('/api/financial-items')
  return raw
    .filter((item) => item.deleted_at == null)
    .map(mapFinancialItem)
}
