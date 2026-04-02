import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, ServerCrash, RefreshCw, Users } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import SearchCard from '../components/ui/SearchCard'
import StatusBadge from '../components/ui/StatusBadge'
import RowActions from '../components/ui/RowActions'
import CounterpartyModal from '../components/ui/CounterpartyModal'
import {
  getCounterparties,
  deleteCounterparty,
} from '../api/counterparties'
import type { Counterparty } from '../api/counterparties'

// ─── table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {[null, 'w-44', 'w-36', 'w-48', 'w-28'].map((w, i) => (
              <th key={i} className={`px-5 py-3 ${w ?? ''}`}>
                <div className="h-3 bg-gray-200 rounded w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              <td className="px-5 py-3.5"><div className="h-3.5 bg-gray-200 rounded w-48" /></td>
              <td className="px-4 py-3.5"><div className="h-3.5 bg-gray-200 rounded w-28" /></td>
              <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 rounded-full w-22" /></td>
              <td className="px-4 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-32" /></td>
              <td className="px-5 py-3.5"><div className="h-6 bg-gray-100 rounded w-14" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── table ────────────────────────────────────────────────────────────────────

function CounterpartiesTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: Counterparty[]
  onEdit: (c: Counterparty) => void
  onDelete: (c: Counterparty) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3">
              Название
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-44">
              БИН/ИИН
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Тип
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-48">
              Контакт
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-28">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="px-5 py-3.5 text-gray-800 font-medium">
                {row.name}
              </td>
              <td className="px-4 py-3.5 font-mono text-gray-600 text-sm">
                {row.binIin ?? <span className="text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge
                  label={row.type === 'supplier' ? 'Поставщик' : 'Покупатель'}
                  variant={row.type}
                />
              </td>
              <td className="px-4 py-3.5 text-gray-600">
                {row.contact ?? <span className="text-gray-400">—</span>}
              </td>
              <td className="px-5 py-3.5">
                <RowActions
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

  // modal state
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return counterparties
    return counterparties.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.binIin ?? '').includes(q) ||
        (c.contact ?? '').toLowerCase().includes(q)
    )
  }, [query, counterparties])

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(c: Counterparty) {
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

  function handleDeleted() {
    setDeleteTarget(null)
    void load()
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Контрагенты"
          subtitle="Управление поставщиками и покупателями"
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
          placeholder="Поиск контрагентов..."
        />

        {/* loading */}
        {status === 'loading' && <TableSkeleton />}

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
            /* empty — no data at all */
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center bg-white border border-gray-200 rounded-lg">
              <Users size={32} className="text-gray-300" />
              <p className="text-gray-500 font-medium">Контрагентов пока нет</p>
              <p className="text-sm text-gray-400">Добавьте первого поставщика или покупателя</p>
            </div>
          ) : filtered.length === 0 ? (
            /* empty — search no results */
            <div className="bg-white border border-gray-200 rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3">Название</th>
                    <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-44">БИН/ИИН</th>
                    <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">Тип</th>
                    <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-48">Контакт</th>
                    <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-28">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="text-center text-sm text-gray-400 py-12">
                      Ничего не найдено по запросу «{query}»
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <CounterpartiesTable
              rows={filtered}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )
        )}

      </div>

      {/* modals */}
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
