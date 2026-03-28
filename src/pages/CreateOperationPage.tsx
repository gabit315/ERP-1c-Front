import { useRef, useState, useEffect } from 'react'
import { Sparkles, Trash2, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { getAccounts, type Account } from '../api/accounts'
import { createOperation, suggestEntries } from '../api/operations'

interface EntryRow {
  id: number
  debit: string
  credit: string
  amount: string
}

interface ValidationErrors {
  date?: string
  number?: string
  description?: string
  entries?: string
  entryRows?: Record<number, { debit?: string; credit?: string; amount?: string; same?: string }>
}

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

const inputErrCls =
  'w-full px-3 py-2.5 text-sm border border-red-300 rounded-lg bg-gray-50 text-gray-700 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-300 transition-colors'

const selectCls =
  'w-full text-sm border border-gray-200 rounded-md bg-white text-gray-700 px-2 py-2 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

const selectErrCls =
  'w-full text-sm border border-red-300 rounded-md bg-white text-gray-700 px-2 py-2 ' +
  'focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-300 transition-colors'

function AccountSelect({
  value,
  onChange,
  accounts,
  hasError,
}: {
  value: string
  onChange: (v: string) => void
  accounts: Account[]
  hasError?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={hasError ? selectErrCls : selectCls}
    >
      <option value="">Выберите счет...</option>
      {accounts.map((a) => (
        <option key={a.code} value={a.code}>
          {a.code} — {a.name}
        </option>
      ))}
    </select>
  )
}

function validate(
  date: string,
  opNumber: string,
  description: string,
  entries: EntryRow[]
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!date.trim()) errors.date = 'Укажите дату операции'
  if (!opNumber.trim()) errors.number = 'Укажите номер операции'
  if (!description.trim()) errors.description = 'Укажите описание операции'
  if (entries.length === 0) errors.entries = 'Добавьте хотя бы одну проводку'

  const entryErrors: ValidationErrors['entryRows'] = {}
  entries.forEach((e) => {
    const rowErrors: { debit?: string; credit?: string; amount?: string; same?: string } = {}
    if (!e.debit) rowErrors.debit = 'Выберите счет дебета'
    if (!e.credit) rowErrors.credit = 'Выберите счет кредита'
    if (!e.amount || Number(e.amount) <= 0) rowErrors.amount = 'Сумма должна быть больше 0'
    if (e.debit && e.credit && e.debit === e.credit)
      rowErrors.same = 'Дебет и кредит не могут совпадать'
    if (Object.keys(rowErrors).length > 0) entryErrors[e.id] = rowErrors
  })
  if (Object.keys(entryErrors).length > 0) errors.entryRows = entryErrors

  return errors
}

export default function CreateOperationPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [opNumber, setOpNumber] = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState<EntryRow[]>([
    { id: 1, debit: '', credit: '', amount: '' },
  ])
  const nextId = useRef(2)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountsError, setAccountsError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [errors, setErrors] = useState<ValidationErrors>({})

  // ─── load accounts ────────────────────────────────────────────────────────

  const loadAccounts = () => {
    setAccountsLoading(true)
    setAccountsError(null)
    getAccounts()
      .then(setAccounts)
      .catch((e: unknown) => {
        setAccountsError(e instanceof Error ? e.message : 'Ошибка загрузки счетов')
      })
      .finally(() => setAccountsLoading(false))
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  // ─── entry helpers ────────────────────────────────────────────────────────

  const addEntry = () => {
    setEntries((prev) => [...prev, { id: nextId.current++, debit: '', credit: '', amount: '' }])
  }

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const updateEntry = (id: number, field: keyof Omit<EntryRow, 'id'>, value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
    // clear per-row errors on change
    if (errors.entryRows?.[id]) {
      setErrors((prev) => {
        const next = { ...prev }
        if (next.entryRows) {
          const rows = { ...next.entryRows }
          delete rows[id]
          next.entryRows = Object.keys(rows).length > 0 ? rows : undefined
        }
        return next
      })
    }
  }

  // ─── AI suggest ──────────────────────────────────────────────────────────

  const handleAiSuggest = () => {
    if (!description.trim()) return
    setAiLoading(true)
    setAiError(null)
    suggestEntries(description.trim())
      .then((suggested) => {
        if (suggested.length === 0) {
          setAiError('ИИ не смог предложить проводки. Попробуйте изменить описание.')
          return
        }
        setEntries(
          suggested.map((s, i) => ({
            id: nextId.current + i,
            debit: s.debit_account_code,
            credit: s.credit_account_code,
            amount: s.amount > 0 ? String(s.amount) : '',
          }))
        )
        nextId.current += suggested.length
        setErrors((prev) => ({ ...prev, entries: undefined, entryRows: undefined }))
      })
      .catch((e: unknown) => {
        setAiError(e instanceof Error ? e.message : 'Ошибка AI-заполнения')
      })
      .finally(() => setAiLoading(false))
  }

  // ─── submit ───────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    const validationErrors = validate(date, opNumber, description, entries)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    createOperation({
      operation_date: date,
      number: opNumber,
      description,
      entries: entries.map((e) => ({
        debit_account_code: e.debit,
        credit_account_code: e.credit,
        amount: Number(e.amount),
      })),
    })
      .then(() => {
        setSubmitSuccess(true)
        // reset form
        setDate(today)
        setOpNumber('')
        setDescription('')
        setEntries([{ id: nextId.current++, debit: '', credit: '', amount: '' }])
      })
      .catch((e: unknown) => {
        setSubmitError(e instanceof Error ? e.message : 'Ошибка сохранения операции')
      })
      .finally(() => setSubmitting(false))
  }

  const handleCancel = () => {
    setDate(today)
    setOpNumber('')
    setDescription('')
    setEntries([{ id: nextId.current++, debit: '', credit: '', amount: '' }])
    setErrors({})
    setSubmitError(null)
    setSubmitSuccess(false)
    setAiError(null)
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeader
          title="Создание операции"
          subtitle="Ядро системы: создание хозяйственных операций и проводок"
        />

        {/* Success banner */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium">
            Операция успешно сохранена.
          </div>
        )}

        {/* Submit error banner */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        {/* Accounts load error */}
        {accountsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-600">{accountsError}</span>
            <button
              onClick={loadAccounts}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline ml-4 shrink-0"
            >
              Повторить
            </button>
          </div>
        )}

        {/* Main form card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">

          {/* Row 1: Date + Operation Number */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Дата операции</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })) }}
                className={errors.date ? inputErrCls : inputCls}
              />
              {errors.date && <span className="text-xs text-red-500">{errors.date}</span>}
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Номер операции</label>
              <input
                type="text"
                value={opNumber}
                onChange={(e) => { setOpNumber(e.target.value); setErrors((p) => ({ ...p, number: undefined })) }}
                placeholder="Например: ОП-00124"
                className={errors.number ? inputErrCls : inputCls}
              />
              {errors.number && <span className="text-xs text-red-500">{errors.number}</span>}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Описание операции</label>
              <button
                type="button"
                disabled={!description.trim() || aiLoading}
                onClick={handleAiSuggest}
                className="flex items-center gap-1.5 text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
              >
                <Sparkles size={14} />
                {aiLoading ? 'Заполняю...' : 'Заполнить с помощью ИИ'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: undefined })); setAiError(null) }}
              placeholder="Например: Оплата коммунальных услуг за март 2026"
              rows={3}
              className={(errors.description ? inputErrCls : inputCls) + ' resize-none'}
            />
            {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
            {aiError && <span className="text-xs text-red-500">{aiError}</span>}
          </div>

          {/* Entries section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Проводки (Дебет/Кредит)</h2>
              <button
                type="button"
                onClick={addEntry}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Добавить проводку
              </button>
            </div>

            {errors.entries && (
              <span className="text-xs text-red-500">{errors.entries}</span>
            )}

            {/* Entries table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_9rem_2.5rem] bg-gray-50 border-b border-gray-200">
                <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3">
                  Дебет (счет)
                </div>
                <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 border-l border-gray-200">
                  Кредит (счет)
                </div>
                <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 border-l border-gray-200">
                  Сумма (₸)
                </div>
                <div className="border-l border-gray-200" />
              </div>

              {/* Rows */}
              {accountsLoading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  Загрузка счетов...
                </div>
              ) : (
                entries.map((entry, index) => {
                  const rowErr = errors.entryRows?.[entry.id]
                  return (
                    <div key={entry.id} className="flex flex-col">
                      <div
                        className={`grid grid-cols-[1fr_1fr_9rem_2.5rem] ${
                          index < entries.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="px-3 py-2.5">
                          <AccountSelect
                            value={entry.debit}
                            onChange={(v) => updateEntry(entry.id, 'debit', v)}
                            accounts={accounts}
                            hasError={!!(rowErr?.debit || rowErr?.same)}
                          />
                        </div>
                        <div className="px-3 py-2.5 border-l border-gray-100">
                          <AccountSelect
                            value={entry.credit}
                            onChange={(v) => updateEntry(entry.id, 'credit', v)}
                            accounts={accounts}
                            hasError={!!(rowErr?.credit || rowErr?.same)}
                          />
                        </div>
                        <div className="px-3 py-2.5 border-l border-gray-100">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.amount}
                            onChange={(e) => updateEntry(entry.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            className={`w-full text-sm border rounded-md bg-white text-gray-700 px-2 py-2 text-right tabular-nums focus:outline-none focus:ring-1 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              rowErr?.amount
                                ? 'border-red-300 focus:ring-red-300 focus:border-red-300'
                                : 'border-gray-200 focus:ring-blue-300 focus:border-blue-300'
                            }`}
                          />
                        </div>
                        <div className="border-l border-gray-100 flex items-center justify-center">
                          {entries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEntry(entry.id)}
                              className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Per-row errors */}
                      {rowErr && (
                        <div className="px-4 pb-2 flex flex-col gap-0.5">
                          {rowErr.same && <span className="text-xs text-red-500">{rowErr.same}</span>}
                          {rowErr.debit && !rowErr.same && <span className="text-xs text-red-500">{rowErr.debit}</span>}
                          {rowErr.credit && !rowErr.same && <span className="text-xs text-red-500">{rowErr.credit}</span>}
                          {rowErr.amount && <span className="text-xs text-red-500">{rowErr.amount}</span>}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Info notice */}
            <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-semibold">Важно:</span>{' '}
                Убедитесь, что сумма по дебету равна сумме по кредиту. Одна операция может
                содержать несколько проводок.
              </p>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || accountsLoading}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Сохранение...' : 'Сохранить операцию'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
