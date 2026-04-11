import { useState, useEffect } from 'react'
import { X, Pencil, Trash2, FileText, Landmark, Plus } from 'lucide-react'
import StatusBadge from './StatusBadge'
import type { Counterparty } from '../../api/counterparties'

// ─── tab definitions ──────────────────────────────────────────────────────────

type Tab = 'info' | 'contracts' | 'bank_accounts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',          label: 'Информация'      },
  { id: 'contracts',     label: 'Договоры'         },
  { id: 'bank_accounts', label: 'Банковские счета' },
]

// ─── info tab ─────────────────────────────────────────────────────────────────

function InfoTab({
  counterparty,
  onEdit,
  onDelete,
}: {
  counterparty: Counterparty
  onEdit: (c: Counterparty) => void
  onDelete: (c: Counterparty) => void
}) {
  const typeLabel   = counterparty.type === 'supplier' ? 'Поставщик' : 'Покупатель'
  const typeVariant = counterparty.type === 'supplier' ? 'supplier'  : 'buyer'

  const fields: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Название',
      value: counterparty.name,
    },
    {
      label: 'Тип',
      value: <StatusBadge label={typeLabel} variant={typeVariant as 'supplier' | 'buyer'} />,
    },
    {
      label: 'БИН/ИИН',
      value: counterparty.binIin
        ? <span className="font-mono">{counterparty.binIin}</span>
        : <span className="text-gray-400">—</span>,
    },
    {
      label: 'Контакт',
      value: counterparty.contact ?? <span className="text-gray-400">—</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {label}
            </p>
            <div className="text-sm text-gray-800">{value}</div>
          </div>
        ))}
      </div>

      {/* notes — full width if present */}
      {counterparty.notes && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Примечания
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{counterparty.notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(counterparty)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Pencil size={14} />
          Редактировать
        </button>
        <button
          onClick={() => onDelete(counterparty)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
          Удалить
        </button>
      </div>
    </div>
  )
}

// ─── stub tab ─────────────────────────────────────────────────────────────────
// Заглушка для вкладок, у которых backend endpoint'ы ещё не реализованы.
// Кнопка добавления видна, но не запускает никакого flow.

function StubTab({
  icon,
  emptyTitle,
  buttonLabel,
}: {
  icon: React.ReactNode
  emptyTitle: string
  buttonLabel: string
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* action row */}
      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
          <Plus size={14} />
          {buttonLabel}
        </button>
      </div>

      {/* empty state */}
      <div className="flex flex-col items-center justify-center gap-3 py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <div className="text-gray-300">
          {icon}
        </div>
        <p className="text-sm text-gray-400">{emptyTitle}</p>
      </div>
    </div>
  )
}

// ─── modal root ───────────────────────────────────────────────────────────────

interface CounterpartyDetailModalProps {
  counterparty: Counterparty
  onClose: () => void
  onEdit: (c: Counterparty) => void
  onDelete: (c: Counterparty) => void
}

export default function CounterpartyDetailModal({
  counterparty,
  onClose,
  onEdit,
  onDelete,
}: CounterpartyDetailModalProps) {
  const [tab, setTab] = useState<Tab>('info')

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-base font-semibold text-gray-800">{counterparty.name}</p>
            {counterparty.binIin && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">БИН/ИИН: {counterparty.binIin}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* tab bar */}
        <div className="flex px-6 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* tab body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && (
            <InfoTab counterparty={counterparty} onEdit={onEdit} onDelete={onDelete} />
          )}
          {tab === 'contracts' && (
            <StubTab
              icon={<FileText size={36} />}
              emptyTitle="Договоры не добавлены"
              buttonLabel="Добавить договор"
            />
          )}
          {tab === 'bank_accounts' && (
            <StubTab
              icon={<Landmark size={36} />}
              emptyTitle="Банковские счета не добавлены"
              buttonLabel="Добавить счет"
            />
          )}
        </div>

      </div>
    </div>
  )
}
