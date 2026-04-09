import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, X, Search } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import RowActions from '../components/ui/RowActions'
import { getAccounts } from '../api/accounts'
import type { Account } from '../api/accounts'

// ─── model ────────────────────────────────────────────────────────────────────
// Backend CRUD для шаблонов операций не реализован.
// Шаблоны хранятся в local state страницы.
// Структура намеренно совпадает с будущим API payload:
//   { name, debit_account_code, credit_account_code, default_description }

export interface OperationTemplate {
  id: number
  name: string
  debitCode: string
  creditCode: string
  defaultDescription: string
}

const SEED_TEMPLATES: OperationTemplate[] = [
  {
    id: 1,
    name: 'Поступление',
    debitCode: '1030',
    creditCode: '3510',
    defaultDescription: 'Поступление оплаты от контрагента',
  },
  {
    id: 2,
    name: 'Оплата',
    debitCode: '2410',
    creditCode: '1030',
    defaultDescription: 'Оплата поставщику',
  },
  {
    id: 3,
    name: 'Зарплата',
    debitCode: '3350',
    creditCode: '1030',
    defaultDescription: 'Выплата заработной платы',
  },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function accountName(accounts: Account[], code: string): string {
  return accounts.find((a) => a.code === code)?.name ?? ''
}

// ─── table ────────────────────────────────────────────────────────────────────

function TemplatesTable({
  rows,
  accounts,
  onEdit,
  onDelete,
}: {
  rows: OperationTemplate[]
  accounts: Account[]
  onEdit: (t: OperationTemplate) => void
  onDelete: (t: OperationTemplate) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3">
              Название
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-56">
              Дебет
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-56">
              Кредит
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3">
              Описание по умолчанию
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-28">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-sm text-gray-400 py-12">
                Шаблоны не найдены
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3.5 text-gray-800 font-medium">{row.name}</td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-gray-800 text-xs">{row.debitCode}</span>
                  {accountName(accounts, row.debitCode) && (
                    <span className="text-gray-400 text-xs ml-1.5">
                      {accountName(accounts, row.debitCode)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-gray-800 text-xs">{row.creditCode}</span>
                  {accountName(accounts, row.creditCode) && (
                    <span className="text-gray-400 text-xs ml-1.5">
                      {accountName(accounts, row.creditCode)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-600">
                  {row.defaultDescription || <span className="text-gray-300">—</span>}
                </td>
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

// ─── modal ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  debitCode: string
  creditCode: string
  defaultDescription: string
}

function TemplateModal({
  initial,
  accounts,
  onClose,
  onSaved,
}: {
  initial: OperationTemplate | null
  accounts: Account[]
  onClose: () => void
  onSaved: (t: OperationTemplate) => void
}) {
  const isEdit = initial !== null
  const nextId = useRef(SEED_TEMPLATES.length + 1)

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    debitCode: initial?.debitCode ?? '',
    creditCode: initial?.creditCode ?? '',
    defaultDescription: initial?.defaultDescription ?? '',
  })

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValid =
    form.name.trim() !== '' &&
    form.debitCode !== '' &&
    form.creditCode !== ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    const saved: OperationTemplate = {
      id: isEdit ? initial.id : nextId.current++,
      name: form.name.trim(),
      debitCode: form.debitCode,
      creditCode: form.creditCode,
      defaultDescription: form.defaultDescription.trim(),
    }
    onSaved(saved)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Редактировать шаблон' : 'Создать шаблон'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Название шаблона <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Например: Поступление"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Дебет (счет) <span className="text-red-500">*</span>
            </label>
            <select
              value={form.debitCode}
              onChange={(e) => set('debitCode', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">— Выберите счет —</option>
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} / {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Кредит (счет) <span className="text-red-500">*</span>
            </label>
            <select
              value={form.creditCode}
              onChange={(e) => set('creditCode', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">— Выберите счет —</option>
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} / {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Описание по умолчанию
            </label>
            <textarea
              value={form.defaultDescription}
              onChange={(e) => set('defaultDescription', e.target.value)}
              placeholder="Это описание будет автоматически подставляться при выборе шаблона"
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  template,
  onClose,
  onDeleted,
}: {
  template: OperationTemplate
  onClose: () => void
  onDeleted: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800">Удалить шаблон?</h2>
        <p className="text-sm text-gray-600">
          Вы уверены, что хотите удалить шаблон{' '}
          <span className="font-medium text-gray-800">«{template.name}»</span>?
          Это действие нельзя отменить.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onDeleted}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OperationTemplatesPage() {
  const [templates, setTemplates] = useState<OperationTemplate[]>(SEED_TEMPLATES)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [query, setQuery] = useState('')

  const [editTarget, setEditTarget] = useState<OperationTemplate | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OperationTemplate | null>(null)

  // Загружаем счета из реального API для select'ов в modal и отображения в таблице.
  // Если API недоступен, select остаётся пустым — не критично для stub-режима.
  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch(() => { /* silently ignore */ })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.debitCode.includes(q) ||
        t.creditCode.includes(q) ||
        t.defaultDescription.toLowerCase().includes(q),
    )
  }, [query, templates])

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(t: OperationTemplate) {
    setEditTarget(t)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleSaved(saved: OperationTemplate) {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    closeModal()
  }

  function handleDeleted() {
    if (!deleteTarget) return
    setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Шаблоны операций"
          subtitle="Управление шаблонами для быстрого заполнения операций"
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Создать шаблон
            </button>
          }
        />

        {/* search */}
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск шаблонов..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors"
            />
          </div>
        </div>

        <TemplatesTable
          rows={filtered}
          accounts={accounts}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />

      </div>

      {modalOpen && (
        <TemplateModal
          initial={editTarget}
          accounts={accounts}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          template={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
