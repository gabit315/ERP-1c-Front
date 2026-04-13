const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:65535'

// ─── request / response types ────────────────────────────────────────────────

export interface SiteChatRequest {
  /** Backend schema: AssistantQuestionPayload.question */
  question: string
  /** Текущий раздел/страница для контекстуализации ответа */
  context?: string
}

export interface SiteChatResponse {
  answer: string
  /** Раздел системы, к которому относится ответ */
  section?: string
  /** Конкретный экран/страница */
  screen?: string
  /** Связанные API-endpoints */
  related_endpoints?: string[]
  /** Предлагаемые следующие действия */
  suggested_actions?: string[]
}

export interface SiteMapSection {
  id: string
  title: string
  description: string
  screens: string[]
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let message = `Ошибка сервера: ${res.status}`
    try {
      const err = (await res.json()) as { detail?: string }
      if (err.detail) message = err.detail
    } catch { /* ignore */ }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

/**
 * POST /api/assistant/site-chat
 * Отправляет сообщение AI-ассистенту и получает ответ о системе.
 */
export function sendSiteChat(req: SiteChatRequest): Promise<SiteChatResponse> {
  return post<SiteChatResponse>('/api/assistant/site-chat', req)
}

/**
 * GET /api/assistant/site-map
 * Возвращает карту разделов системы для контекстуализации ответов ассистента.
 */
export async function getSiteMap(): Promise<SiteMapSection[]> {
  const res = await fetch(`${BASE_URL}/api/assistant/site-map`)
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`)
  return res.json() as Promise<SiteMapSection[]>
}
