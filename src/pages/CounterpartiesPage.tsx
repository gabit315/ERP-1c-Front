import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus,
  ServerCrash,
  RefreshCw,
  Users,
  ChevronRight,
  Pencil,
  Trash2,
  Phone,
} from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import SearchCard from '../components/ui/SearchCard'
import StatusBadge from '../components/ui/StatusBadge'
import CounterpartyModal from '../components/ui/CounterpartyModal'
import CounterpartyDetailModal from '../components/ui/CounterpartyDetailModal'
import {
  getCounterparties,
  deleteCounterparty,
} from '../api/counterparties'
import type { Counterparty } from '../api/counterparties'

// ─── type label helper ────────────────────────────────────────────────────────

function typeBadge(type: Counterparty['type']) {
  if (type === 'supplier') return { label: 'Поставщик', variant: 'supplier' } as const
  return                          { label: 'Покупатель', variant: 'buyer'    } as const
}

// ─── card skeleton ────────────────────────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="h-5 bg-gray-100 rounded-full w-24" />
            <div className="flex gap-1.5">
              <div className="w-6 h-6 bg-gray-100 rounded" />
              <div className="w-6 h-6 bg-gray-100 rounded" />
            </div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-1.5" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-40" />
          <div className="pt-1 border-t border-gray-100">
            <div className="h-3.5 bg-gray-100 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── counterparty card ────────────────────────────────────────────────────────

function CounterpartyCard({
  counterparty,
  onDetails,
  onEdit,
  onDelete,
}: {
  counterparty: Counterparty
  onDetails: (c: Counterparty) => void
  onEdit: (c: Counterparty) => void
  onDelete: (c: Counterparty) => void
}) {
  const badge = typeBadge(counterparty.type)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3 hover:border-gray-300 transition-colors">

      {/* type badge + edit/delete actions */}
      <div className="flex items-start justify-between gap-2">
        <StatusBadge label={badge.label} variant={badge.variant} />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(counterparty)}
            title="Редактировать"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(counterparty)}
            title="Удалить"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* name + BIN/IIN */}
      <div>
        <p className="text-sm font-semibold text-gray-800 leading-snug">{counterparty.name}</p>
        {counterparty.binIin ? (
          <p className="text-xs text-gray-400 font-mono mt-0.5">БИН/ИИН: {counterparty.binIin}</p>
        ) : (
          <p className="text-xs text-gray-300 mt-0.5">БИН/ИИН не указан</p>
        )}
      </div>

      {/* contact (phone / email — единое поле из API) */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Phone size={13} className="text-gray-300 shrink-0" />
        {counterparty.contact ? (
          <span className="text-xs text-gray-500 truncate">{counterparty.contact}</span>
        ) : (
          <span className="text-xs text-gray-300">Контакт не указан</span>
        )}
      </div>

      {/* footer: Подробнее — opens detail modal with tabs */}
      <div className="mt-auto pt-2 border-t border-gray-100">
        <button
          onClick={() => onDetails(counterparty)}
          className="flex items-center gap-0.5 text-blue-600 hover:text-blue-700 text-sm transition-colors"
        >
          Подробнее
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── cards grid ───────────────────────────────────────────────────────────────

function CounterpartiesGrid({
  rows,
  onDetails,
  onEdit,
  onDelete,
}: {
  rows: Counterparty[]
  onDetails: (c: Counterparty) => void
  onEdit: (c: Counterparty) => void
  onDelete: (c: Counterparty) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((c) => (
        <CounterpartyCard
          key={c.id}
          counterparty={c}
          onDetails={onDetails}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  counterparty,
  onClose,
  onDeleted,
}: {
  counterparty: Counterparty
  onClose: () => void
  onDeleted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    try {
      await deleteCounterparty(counterparty.id)
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800">Удалить контрагента?</h2>
        <p className="text-sm text-gray-600">
          Вы уверены, что хотите удалить{' '}
          <span className="font-medium text-gray-800">{counterparty.name}</span>?
          Это действие нельзя отменить.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={submitting}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

type LoadStatus = 'loading' | 'error' | 'success'

export default function CounterpartiesPage() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')

  const [detailTarget, setDetailTarget] = useState<Counterparty | null>(null)
  const [editTarget, setEditTarget] = useState<Counterparty | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Counterparty | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await getCounterparties()
      setCounterparties(data)
      setStatus('success')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // search: name, BIN/IIN, contact (contains phone / email)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return counterparties
    return counterparties.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.binIin ?? '').includes(q) ||
        (c.contact ?? '').toLowerCase().includes(q),
    )
  }, [query, counterparties])

  function openDetail(c: Counterparty) {
    setDetailTarget(c)
  }

  function openCreate() {
    setDetailTarget(null)
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(c: Counterparty) {
    // called from detail modal — close detail first, then open edit
    setDetailTarget(null)
    setEditTarget(c)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleSaved() {
    closeModal()
    void load()
  }

  function openDeleteFromDetail(c: Counterparty) {
    // called from detail modal — close detail first, then open delete confirm
    setDetailTarget(null)
    setDeleteTarget(c)
  }

  function handleDeleted() {
    setDeleteTarget(null)
    void load()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-5">

        <PageHeaderWithAction
          title="Контрагенты"
          subtitle="Управление контрагентами, договорами и банковскими счетами"
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Добавить контрагента
            </button>
          }
        />

        <SearchCard
          value={query}
          onChange={setQuery}
          placeholder="Поиск по названию, БИН или email..."
        />

        {/* loading */}
        {status === 'loading' && <CardsSkeleton />}

        {/* error */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <ServerCrash size={32} className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-700 font-medium">Не удалось загрузить список контрагентов</p>
              <p className="text-sm text-gray-400 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => void load()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={14} />
              Повторить
            </button>
          </div>
        )}

        {/* success */}
        {status === 'success' && (
          counterparties.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center bg-white border border-gray-200 rounded-lg">
              <Users size={32} className="text-gray-300" />
              <p className="text-gray-500 font-medium">Контрагентов пока нет</p>
              <p className="text-sm text-gray-400">Добавьте первого поставщика или покупателя</p>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 mt-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={15} />
                Добавить контрагента
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center bg-white border border-gray-200 rounded-lg">
              <Users size={28} className="text-gray-300" />
              <p className="text-sm text-gray-500">
                Ничего не найдено по запросу{' '}
                <span className="font-medium text-gray-700">«{query}»</span>
              </p>
            </div>
          ) : (
            <CounterpartiesGrid
              rows={filtered}
              onDetails={openDetail}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )
        )}

      </div>

      {/* modals */}
      {detailTarget && (
        <CounterpartyDetailModal
          counterparty={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={openEdit}
          onDelete={openDeleteFromDetail}
        />
      )}

      {modalOpen && (
        <CounterpartyModal
          initial={editTarget}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          counterparty={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
