import { apiFetch } from './client'

const BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

type OperationTemplateApiEntry = {
  line_no: number
  debit_account_code: string
  debit_account_name: string
  credit_account_code: string
  credit_account_name: string
  comment?: string | null
}

type OperationTemplateApi = {
  id: string            // slug, например "salary-payment"
  template_id: number   // реальный int id для PUT/DELETE
  title: string
  description: string
  category?: string
  source?: string
  default_status?: string
  counterparty_required?: boolean
  employee_required?: boolean
  item_hint?: string | null
  is_system?: boolean
  created_at?: string
  updated_at?: string
  entries?: OperationTemplateApiEntry[]
}

// Оставляем UI-модель такой, какой ее уже ждет страница
export interface OperationTemplate {
  id: number
  slug: string
  name: string
  debit_account_code: string
  credit_account_code: string
  default_description: string
}

export interface OperationTemplatePayload {
  name: string
  debit_account_code: string
  credit_account_code: string
  default_description: string
}

function mapTemplate(api: OperationTemplateApi): OperationTemplate {
  const firstEntry = api.entries?.[0]

  return {
    id: api.template_id,
    slug: api.id,
    name: api.title,
    debit_account_code: firstEntry?.debit_account_code ?? '',
    credit_account_code: firstEntry?.credit_account_code ?? '',
    default_description: api.description ?? '',
  }
}

export async function getOperationTemplates(): Promise<OperationTemplate[]> {
  const data = await apiFetch<OperationTemplateApi[]>('/api/operations/templates')
  return data.map(mapTemplate)
}

async function mutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = `Ошибка сервера: ${res.status}`
    try {
      const err = (await res.json()) as { detail?: string }
      if (err.detail) message = err.detail
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function createOperationTemplate(
    payload: OperationTemplatePayload,
): Promise<OperationTemplate> {
  const data = await mutate<OperationTemplateApi>('/api/operations/templates', 'POST', payload)
  return mapTemplate(data)
}

export async function updateOperationTemplate(
    id: number,
    payload: OperationTemplatePayload,
): Promise<OperationTemplate> {
  const data = await mutate<OperationTemplateApi>(`/api/operations/templates/${id}`, 'PUT', payload)
  return mapTemplate(data)
}

export function deleteOperationTemplate(id: number): Promise<void> {
  return mutate<void>(`/api/operations/templates/${id}`, 'DELETE')
}