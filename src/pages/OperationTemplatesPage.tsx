import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, X, Search, ServerCrash, RefreshCw } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import RowActions from '../components/ui/RowActions'
import { getAccounts } from '../api/accounts'
import type { Account } from '../api/accounts'
import {
  getOperationTemplates,
  createOperationTemplate,
  updateOperationTemplate,
  deleteOperationTemplate,
} from '../api/operationTemplates'
import type { OperationTemplate, OperationTemplatePayload } from '../api/operationTemplates'

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
                  <span className="font-mono text-gray-800 text-xs">{row.debit_account_code}</span>
                  {accountName(accounts, row.debit_account_code) && (
                    <span className="text-gray-400 text-xs ml-1.5">
                      {accountName(accounts, row.debit_account_code)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-gray-800 text-xs">{row.credit_account_code}</span>
                  {accountName(accounts, row.credit_account_code) && (
                    <span className="text-gray-400 text-xs ml-1.5">
                      {accountName(accounts, row.credit_account_code)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-600">
                  {row.default_description || <span className="text-gray-300">—</span>}
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
  onSaved: () => void
}) {
  const isEdit = initial !== null

  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    debitCode: initial?.debit_account_code ?? '',
    creditCode: initial?.credit_account_code ?? '',
    defaultDescription: initial?.default_description ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isValid =
    form.name.trim() !== '' &&
    form.debitCode !== '' &&
    form.creditCode !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    const payload: OperationTemplatePayload = {
      name: form.name.trim(),
      debit_account_code: form.debitCode,
      credit_account_code: form.creditCode,
      default_description: form.defaultDescription.trim(),
    }

    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        await updateOperationTemplate(initial.id, payload)
      } else {
        await createOperationTemplate(payload)
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldCls =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 ' +
    'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors ' +
    'disabled:bg-gray-50 disabled:text-gray-400'

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
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Название шаблона <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={submitting}
              placeholder="Например: Поступление"
              className={fieldCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Дебет (счет) <span className="text-red-500">*</span>
            </label>
            <select
              value={form.debitCode}
              onChange={(e) => set('debitCode', e.target.value)}
              disabled={submitting}
              className={fieldCls}
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
              disabled={submitting}
              className={fieldCls}
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
              disabled={submitting}
              placeholder="Это описание будет автоматически подставляться при выборе шаблона"
              rows={3}
              className={`${fieldCls} resize-none`}
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
              disabled={!isValid || submitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    try {
      await deleteOperationTemplate(template.id)
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800">Удалить шаблон?</h2>
        <p className="text-sm text-gray-600">
          Вы уверены, что хотите удалить шаблон{' '}
          <span className="font-medium text-gray-800">«{template.name}»</span>?
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

export default function OperationTemplatesPage() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [templates, setTemplates] = useState<OperationTemplate[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [query, setQuery] = useState('')

  const [editTarget, setEditTarget] = useState<OperationTemplate | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OperationTemplate | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [tmpl, accs] = await Promise.all([getOperationTemplates(), getAccounts()])
      setTemplates(tmpl)
      setAccounts(accs)
      setStatus('success')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.debit_account_code.includes(q) ||
        t.credit_account_code.includes(q) ||
        t.default_description.toLowerCase().includes(q),
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

  function handleSaved() {
    closeModal()
    void load()
  }

  function handleDeleted() {
    setDeleteTarget(null)
    void load()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-5">

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
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-4">
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

        {/* loading */}
        {status === 'loading' && (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
            <span className="text-sm text-gray-400">Загрузка...</span>
          </div>
        )}

        {/* error */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <ServerCrash size={32} className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-700 font-medium">Не удалось загрузить шаблоны</p>
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
          <TemplatesTable
            rows={filtered}
            accounts={accounts}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        )}

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
