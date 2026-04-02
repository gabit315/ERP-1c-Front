import { apiFetch } from './client'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── raw API types ────────────────────────────────────────────────────────────

interface ApiEmployee {
  id: number
  full_name: string
  position: string
  department: string
  iin: string
  deleted_at: string | null
}

// ─── frontend model ───────────────────────────────────────────────────────────

export interface Employee {
  id: number
  fullName: string
  position: string
  department: string
  iin: string
}

// ─── payload ─────────────────────────────────────────────────────────────────

export interface EmployeePayload {
  full_name: string
  position: string
  department: string
  iin: string
}

// ─── mapper ───────────────────────────────────────────────────────────────────

function mapEmployee(e: ApiEmployee): Employee {
  return {
    id: e.id,
    fullName: e.full_name,
    position: e.position,
    department: e.department,
    iin: e.iin,
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

export async function getEmployees(): Promise<Employee[]> {
  const raw = await apiFetch<ApiEmployee[]>('/api/employees')
  return raw
    .filter((e) => e.deleted_at == null)
    .map(mapEmployee)
}

export async function createEmployee(payload: EmployeePayload): Promise<void> {
  await mutate('/api/employees', 'POST', payload)
}

export async function updateEmployee(id: number, payload: EmployeePayload): Promise<void> {
  await mutate(`/api/employees/${id}`, 'PUT', payload)
}

export async function deleteEmployee(id: number): Promise<void> {
  await mutate(`/api/employees/${id}`, 'DELETE')
}
