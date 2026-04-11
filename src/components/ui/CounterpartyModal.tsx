import { useState } from 'react'
import { X } from 'lucide-react'
import { createCounterparty, updateCounterparty } from '../../api/counterparties'
import type { Counterparty, CounterpartyPayload } from '../../api/counterparties'

interface FormState {
  name: string
  binIin: string
  type: 'supplier' | 'buyer'
  contact: string
  notes: string
}

interface CounterpartyModalProps {
  initial: Counterparty | null   // null = create mode
  onClose: () => void
  onSaved: () => void
}

export default function CounterpartyModal({ initial, onClose, onSaved }: CounterpartyModalProps) {
  const isEdit = initial !== null

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    binIin: initial?.binIin ?? '',
    type: initial?.type ?? 'supplier',
    contact: initial?.contact ?? '',
    notes: initial?.notes ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Название обязательно')
      return
    }

    const payload: CounterpartyPayload = {
      name: form.name.trim(),
      bin_iin: form.binIin.trim() || null,
      counterparty_type: form.type,
      contact: form.contact.trim() || null,
      notes: form.notes.trim() || null,
    }

    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        await updateCounterparty(initial.id, payload)
      } else {
        await createCounterparty(payload)
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Редактировать контрагента' : 'Новый контрагент'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Название <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={submitting}
              placeholder="ТОО «Название компании»"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">БИН/ИИН</label>
            <input
              type="text"
              value={form.binIin}
              onChange={(e) => set('binIin', e.target.value)}
              disabled={submitting}
              placeholder="123456789012"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Тип <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value as 'supplier' | 'buyer')}
              disabled={submitting}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="supplier">Поставщик</option>
              <option value="buyer">Покупатель</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Контакт</label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
              disabled={submitting}
              placeholder="+7 700 000 0000"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Примечания</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              disabled={submitting}
              placeholder="Дополнительная информация..."
              rows={3}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
