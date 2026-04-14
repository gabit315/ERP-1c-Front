import { apiFetch } from './client'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

export interface OperationTemplate {
  id: number
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

export function getOperationTemplates(): Promise<OperationTemplate[]> {
  return apiFetch<OperationTemplate[]>('/api/operation-templates')
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
    } catch { /* ignore */ }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function createOperationTemplate(payload: OperationTemplatePayload): Promise<OperationTemplate> {
  return mutate<OperationTemplate>('/api/operation-templates', 'POST', payload)
}

export function updateOperationTemplate(id: number, payload: OperationTemplatePayload): Promise<OperationTemplate> {
  return mutate<OperationTemplate>(`/api/operation-templates/${id}`, 'PUT', payload)
}

export function deleteOperationTemplate(id: number): Promise<void> {
  return mutate<void>(`/api/operation-templates/${id}`, 'DELETE')
}
