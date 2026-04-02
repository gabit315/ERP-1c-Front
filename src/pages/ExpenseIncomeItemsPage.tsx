import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, X } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import RowActions from '../components/ui/RowActions'
import {
  getFinancialItems,
  createFinancialItem,
  updateFinancialItem,
  deleteFinancialItem,
} from '../api/financialItems'
import type { FinancialItem, FinancialItemPayload } from '../api/financialItems'

type Tab = 'expenses' | 'income'

const tabs: { id: Tab; label: string }[] = [
  { id: 'expenses', label: 'Расходы' },
  { id: 'income',   label: 'Доходы'  },
]

// ─── table ────────────────────────────────────────────────────────────────────

function ItemsTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
}: {
  rows: FinancialItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onEdit: (item: FinancialItem) => void
  onDelete: (item: FinancialItem) => void
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
        <span className="text-sm text-gray-400">Загрузка...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-sm text-red-500">{error}</span>
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3">
              Название
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-64">
              Категория
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-28">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center text-sm text-gray-400 py-12">
                Ничего не найдено
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3.5 text-gray-800 font-medium">{row.name}</td>
                <td className="px-4 py-3.5 text-gray-600">{row.category}</td>
                <td className="px-5 py-3.5">
                  <RowActions
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── form modal ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  category: string
  itemType: 'expense' | 'income'
  defaultAccountCode: string
}

function FinancialItemModal({
  initial,
  defaultType,
  onClose,
  onSaved,
}: {
  initial: FinancialItem | null
  defaultType: 'expense' | 'income'
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = initial !== null

  const [form, setForm] = useState<FormState>({
    name: initial?.name !== '—' ? (initial?.name ?? '') : '',
    category: initial?.category !== '—' ? (initial?.category ?? '') : '',
    itemType: initial?.itemType ?? defaultType,
    defaultAccountCode: initial?.defaultAccountCode ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Название обязательно'); return }
    if (!form.category.trim()) { setError('Категория обязательна'); return }

    const payload: FinancialItemPayload = {
      name: form.name.trim(),
      category: form.category.trim(),
      item_type: form.itemType,
      default_account_code: form.defaultAccountCode.trim() || null,
    }

    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        await updateFinancialItem(initial.id, payload)
      } else {
        await createFinancialItem(payload)
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
            {isEdit ? 'Редактировать статью' : 'Новая статья'}
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
              placeholder="Аренда офиса"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Категория <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              disabled={submitting}
              placeholder="Административные расходы"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Тип <span className="text-red-500">*</span>
            </label>
            <select
              value={form.itemType}
              onChange={(e) => set('itemType', e.target.value as 'expense' | 'income')}
              disabled={submitting}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Счёт по умолчанию</label>
            <input
              type="text"
              value={form.defaultAccountCode}
              onChange={(e) => set('defaultAccountCode', e.target.value)}
              disabled={submitting}
              placeholder="7210"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
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

// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  item,
  onClose,
  onDeleted,
}: {
  item: FinancialItem
  onClose: () => void
  onDeleted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    try {
      await deleteFinancialItem(item.id)
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800">Удалить статью?</h2>
        <p className="text-sm text-gray-600">
          Вы уверены, что хотите удалить статью{' '}
          <span className="font-medium text-gray-800">«{item.name}»</span>?
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

export default function ExpenseIncomeItemsPage() {
  const [items, setItems] = useState<FinancialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('expenses')
  const [query, setQuery] = useState('')

  const [editTarget, setEditTarget] = useState<FinancialItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FinancialItem | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getFinancialItems()
      .then(setItems)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setQuery('')
  }

  const filtered = useMemo(() => {
    const tabItems = items.filter(
      (item) => item.itemType === (activeTab === 'expenses' ? 'expense' : 'income')
    )
    const q = query.trim().toLowerCase()
    if (!q) return tabItems
    return tabItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query, activeTab, items])

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(item: FinancialItem) {
    setEditTarget(item)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleSaved() {
    closeModal()
    load()
  }

  function handleDeleted() {
    setDeleteTarget(null)
    load()
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Статьи расходов и доходов"
          subtitle="Классификация финансовых операций"
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Добавить статью
            </button>
          }
        />

        {/* Tabs + search combined card */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex-1 py-3 text-sm font-medium text-center transition-colors
                    ${isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск статей..."
                className="
                  w-full pl-9 pr-4 py-2.5 text-sm
                  border border-gray-200 rounded-lg
                  bg-gray-50 text-gray-700 placeholder-gray-400
                  focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300
                  transition-colors
                "
              />
            </div>
          </div>
        </div>

        <ItemsTable
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={load}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />

      </div>

      {modalOpen && (
        <FinancialItemModal
          initial={editTarget}
          defaultType={activeTab === 'expenses' ? 'expense' : 'income'}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
