const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Ошибка сервера: ${res.status}`)
  }
  return res.json() as Promise<T>
}
