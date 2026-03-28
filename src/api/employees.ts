import { apiFetch } from './client'

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

// ─── public API ──────────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
  const raw = await apiFetch<ApiEmployee[]>('/api/employees')
  return raw
    .filter((e) => e.deleted_at == null)
    .map(mapEmployee)
}
