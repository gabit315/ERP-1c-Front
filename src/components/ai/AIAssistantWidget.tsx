import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X, Sparkles, ChevronRight } from 'lucide-react'
import { sendSiteChat, type SiteChatResponse } from '../../api/assistant'

// ─── types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  suggestedActions?: string[]
  section?: string
}

// ─── quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'debts',    label: 'Показать задолженности' },
  { id: 'osv',      label: 'Сформировать ОСВ' },
  { id: 'document', label: 'Почему не проводится документ?' },
  { id: 'guide',    label: 'Как создать операцию?' },
] as const

// ─── greeting ─────────────────────────────────────────────────────────────────

const GREETING: ChatMessage = {
  id: 0,
  role: 'assistant',
  content:
    'Привет! Я AI-ассистент этой системы.\n\nМогу помочь с навигацией, объяснить как работают разделы, помочь с проводками или отчётами.\n\nЧто вас интересует?',
}

// ─── component ────────────────────────────────────────────────────────────────

let nextId = 1

export default function AIAssistantWidget() {
  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState<ChatMessage[]>([GREETING])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const appendMessage = (msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId++ }])
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInput('')
    setError(null)
    appendMessage({ role: 'user', content: trimmed })
    setLoading(true)

    try {
      const res: SiteChatResponse = await sendSiteChat({ question: trimmed })
      appendMessage({
        role: 'assistant',
        content: res.answer,
        suggestedActions: res.suggested_actions,
        section: res.section,
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка соединения с ассистентом'
      setError(msg)
      appendMessage({
        role: 'assistant',
        content: `Не удалось получить ответ: ${msg}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  const handleQuickAction = (label: string) => {
    void sendMessage(label)
  }

  const handleSuggestedAction = (action: string) => {
    void sendMessage(action)
  }

  const resetChat = () => {
    setMessages([GREETING])
    setInput('')
    setError(null)
  }

  const showQuickActions = messages.length <= 1

  return (
    <>
      {/* ── floating button ──────────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label="Открыть AI-ассистент"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)', width: 52, height: 52 }}
      >
        {open ? (
          <X size={20} className="text-white" />
        ) : (
          <Sparkles size={20} className="text-white" />
        )}
      </button>

      {/* ── chat panel ───────────────────────────────────────────────────────── */}
      {open && (
        <>
          {/* backdrop (mobile / low z-index, semi-transparent) */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed bottom-20 right-6 z-50 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: 380, height: 560 }}
          >
            {/* ── header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">AI Ассистент</p>
                  <p className="text-xs text-white/70 mt-0.5 leading-none">ERP система</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetChat}
                  title="Начать новый чат"
                  className="text-white/70 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                >
                  Сбросить
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white/70 hover:text-white transition-colors p-1 rounded"
                  aria-label="Закрыть"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* section badge */}
                  {msg.section && (
                    <span className="text-xs text-gray-400 px-1">
                      Раздел: {msg.section}
                    </span>
                  )}

                  {/* suggested follow-up actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-col gap-1 w-full max-w-[85%]">
                      {msg.suggestedActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => handleSuggestedAction(action)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 text-left px-1 transition-colors"
                        >
                          <ChevronRight size={11} className="shrink-0" />
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* loading bubble */}
              {loading && (
                <div className="flex items-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── quick actions ── */}
            {showQuickActions && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.id}
                    type="button"
                    onClick={() => handleQuickAction(qa.label)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── input area ── */}
            <div className="px-4 pb-4 shrink-0 border-t border-gray-100 pt-3">
              {error && (
                <p className="text-xs text-red-500 mb-2">{error}</p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите вопрос... (Enter — отправить)"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors disabled:opacity-60 max-h-24 overflow-y-auto leading-relaxed"
                  style={{ minHeight: 42 }}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Отправить"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
                >
                  <Send size={15} className="text-white" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                Shift+Enter — перенос строки
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
