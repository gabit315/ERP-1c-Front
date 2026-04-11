import { useRef, useState, useEffect, useMemo } from 'react'
import { Sparkles, Trash2, AlertCircle, Upload, ArrowLeft, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { getAccounts, type Account } from '../api/accounts'
import { getCounterparties, type Counterparty } from '../api/counterparties'
import { createOperation, suggestEntries } from '../api/operations'
import { getOperationsSystemTemplates, type OperationSystemTemplate } from '../api/operations'

// ─── types ────────────────────────────────────────────────────────────────────

interface EntryRow {
  id: number
  debit: string
  credit: string
  amount: string
}

// ─── style constants ──────────────────────────────────────────────────────────

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

// ─── AccountSelect ────────────────────────────────────────────────────────────

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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CreateOperationPage({ onBack }: { onBack?: () => void } = {}) {
  const today = new Date().toISOString().slice(0, 10)
  const nextId = useRef(2)

  // ── form fields ──────────────────────────────────────────────────────────
  const [date, setDate]               = useState(today)
  const [opNumber, setOpNumber]       = useState('')
  const [counterpartyId, setCpId]     = useState('')
  const [contract, setContract]       = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries]         = useState<EntryRow[]>([
    { id: 1, debit: '', credit: '', amount: '' },
  ])

  // ── template state ────────────────────────────────────────────────────────
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [templates, setTemplates]           = useState<OperationSystemTemplate[]>([])
  const [templatesLoading, setTplLoading]   = useState(true)

  // ── resources ────────────────────────────────────────────────────────────
  const [accounts, setAccounts]           = useState<Account[]>([])
  const [accountsLoading, setAccLoading]  = useState(true)
  const [accountsError, setAccError]      = useState<string | null>(null)
  const [counterparties, setCPs]          = useState<Counterparty[]>([])

  // ── ui state ─────────────────────────────────────────────────────────────
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSuccess]   = useState(false)
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiError, setAiError]         = useState<string | null>(null)
  const [touched, setTouched]         = useState(false)

  // ── load ─────────────────────────────────────────────────────────────────

  const loadAccounts = () => {
    setAccLoading(true)
    setAccError(null)
    getAccounts()
      .then(setAccounts)
      .catch((e: unknown) => setAccError(e instanceof Error ? e.message : 'Ошибка загрузки счетов'))
      .finally(() => setAccLoading(false))
  }

  useEffect(() => {
    loadAccounts()
    getCounterparties().then(setCPs).catch(() => {})
    getOperationsSystemTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setTplLoading(false))
  }, [])

  // ── template helpers ──────────────────────────────────────────────────────

  const applyTemplate = (tpl: OperationSystemTemplate) => {
    setActiveTemplate(tpl.id)
    setDescription(tpl.description)
    // Fill first entry from template's first entry; preserve amount
    const firstEntry = tpl.entries[0]
    setEntries((prev) => {
      const first = prev[0]
      return [
        {
          id: first?.id ?? nextId.current++,
          debit:  firstEntry?.debit_account_code  ?? '',
          credit: firstEntry?.credit_account_code ?? '',
          amount: first?.amount ?? '',
        },
        ...prev.slice(1),
      ]
    })
    setAiError(null)
  }

  const clearTemplate = () => {
    setActiveTemplate(null)
    setDescription('')
    setEntries([{ id: nextId.current++, debit: '', credit: '', amount: '' }])
    setAiError(null)
  }

  // ── entry helpers ─────────────────────────────────────────────────────────

  const addEntry = () =>
    setEntries((prev) => [...prev, { id: nextId.current++, debit: '', credit: '', amount: '' }])

  const removeEntry = (id: number) =>
    setEntries((prev) => prev.filter((e) => e.id !== id))

  const updateEntry = (id: number, field: keyof Omit<EntryRow, 'id'>, value: string) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))

  // ── balance ──────────────────────────────────────────────────────────────

  const totalDebit = useMemo(
    () =>
      entries
        .filter((e) => e.debit !== '' && Number(e.amount) > 0)
        .reduce((s, e) => s + Number(e.amount), 0),
    [entries],
  )

  const totalCredit = useMemo(
    () =>
      entries
        .filter((e) => e.credit !== '' && Number(e.amount) > 0)
        .reduce((s, e) => s + Number(e.amount), 0),
    [entries],
  )

  const difference = Math.abs(totalDebit - totalCredit)
  const balanced   = totalDebit > 0 && totalDebit === totalCredit

  // ── validation ────────────────────────────────────────────────────────────

  const fieldErrors = useMemo(() => {
    if (!touched) return {}
    const e: Record<string, string> = {}
    if (!date.trim())        e.date        = 'Укажите дату'
    if (!opNumber.trim())    e.number      = 'Укажите номер'
    if (!description.trim()) e.description = 'Укажите описание'
    if (entries.length === 0) e.entries    = 'Добавьте хотя бы одну проводку'
    entries.forEach((row) => {
      if (!row.debit)                            e[`d${row.id}`] = 'Выберите дебет'
      if (!row.credit)                           e[`c${row.id}`] = 'Выберите кредит'
      if (!row.amount || Number(row.amount) <= 0) e[`a${row.id}`] = 'Сумма > 0'
    })
    return e
  }, [touched, date, opNumber, description, entries])

  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  const canPost        = !hasFieldErrors && balanced && !submitting

  // ── AI suggest ────────────────────────────────────────────────────────────

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
          })),
        )
        nextId.current += suggested.length
      })
      .catch((e: unknown) => setAiError(e instanceof Error ? e.message : 'Ошибка AI-заполнения'))
      .finally(() => setAiLoading(false))
  }

  // ── submit ────────────────────────────────────────────────────────────────

  const submit = (isDraft: boolean) => {
    setTouched(true)
    if (!isDraft && (!balanced || hasFieldErrors)) return
    if (isDraft && (!date.trim() || !opNumber.trim() || !description.trim())) return

    setSubmitting(true)
    setSubmitError(null)
    setSuccess(false)

    createOperation({
      operation_date: date,
      number: opNumber,
      description,
      counterparty_id: counterpartyId ? Number(counterpartyId) : null,
      status: isDraft ? 'draft' : 'posted',
      entries: entries
        .filter((e) => e.debit && e.credit && Number(e.amount) > 0)
        .map((e) => ({
          debit_account_code: e.debit,
          credit_account_code: e.credit,
          amount: Number(e.amount),
        })),
    })
      .then(() => {
        setSuccess(true)
        resetForm()
      })
      .catch((e: unknown) =>
        setSubmitError(e instanceof Error ? e.message : 'Ошибка сохранения операции'),
      )
      .finally(() => setSubmitting(false))
  }

  const resetForm = () => {
    setDate(today)
    setOpNumber('')
    setCpId('')
    setContract('')
    setDescription('')
    setEntries([{ id: nextId.current++, debit: '', credit: '', amount: '' }])
    setActiveTemplate(null)
    setTouched(false)
    setSubmitError(null)
    setAiError(null)
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-5">

        {/* back link */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors w-fit"
          >
            <ArrowLeft size={15} />
            Вернуться к списку операций
          </button>
        )}

        <PageHeader
          title="Создание операции"
          subtitle="Создание хозяйственной операции с проводками"
        />

        {/* ── banners ─────────────────────────────────────────────────────── */}

        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium">
            Операция успешно сохранена.
          </div>
        )}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}
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

        {/* ── templates card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Шаблоны (быстрое заполнение)</h2>
            <button
              type="button"
              onClick={clearTemplate}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Очистить шаблон
            </button>
          </div>
          {templatesLoading ? (
            <p className="text-sm text-gray-400">Загрузка шаблонов...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-400">Нет шаблонов. Создайте их в разделе «Шаблоны операций».</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => {
                const isActive = activeTemplate === tpl.id
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {tpl.title}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── system rule ─────────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 flex gap-3">
          <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <span className="font-semibold">Правило системы:</span>{' '}
            Сумма по дебету должна равняться сумме по кредиту. Операция будет заблокирована
            для проведения до устранения расхождений.
          </p>
        </div>

        {/* ── main form card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">

          {/* Row 1: Date + Number */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Дата операции <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldErrors.date ? inputErrCls : inputCls}
              />
              {fieldErrors.date && <span className="text-xs text-red-500">{fieldErrors.date}</span>}
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Номер операции <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={opNumber}
                onChange={(e) => setOpNumber(e.target.value)}
                placeholder="Например: ОП-00124"
                className={fieldErrors.number ? inputErrCls : inputCls}
              />
              {fieldErrors.number && <span className="text-xs text-red-500">{fieldErrors.number}</span>}
            </div>
          </div>

          {/* Row 2: Counterparty + Contract */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Контрагент</label>
              <select
                value={counterpartyId}
                onChange={(e) => setCpId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Выберите контрагента —</option>
                {counterparties.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Договор</label>
              <input
                type="text"
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                placeholder="Номер или название договора"
                className={inputCls}
              />
            </div>
          </div>

          {/* Document upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Документ операции</label>
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-5 py-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <Upload size={20} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Загрузить документ</span>
              <span className="text-xs text-gray-400">PDF, JPG, PNG (макс. 10 МБ)</span>
              <span className="text-xs text-gray-400 text-center">
                Прикрепите документ для автозаполнения через AI
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" />
            </label>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">
                Описание операции <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                disabled={!description.trim() || aiLoading}
                onClick={handleAiSuggest}
                className="flex items-center gap-1.5 text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
              >
                <Sparkles size={14} />
                {aiLoading ? 'Заполняю...' : 'Заполнить с ИИ'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setAiError(null) }}
              placeholder="Например: Оплата коммунальных услуг за март 2026"
              rows={3}
              className={(fieldErrors.description ? inputErrCls : inputCls) + ' resize-none'}
            />
            {fieldErrors.description && (
              <span className="text-xs text-red-500">{fieldErrors.description}</span>
            )}
            {aiError && <span className="text-xs text-red-500">{aiError}</span>}
          </div>

          {/* ── entries ───────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Проводки <span className="text-red-500">*</span>
              </h2>
              <button
                type="button"
                onClick={addEntry}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Добавить проводку
              </button>
            </div>

            {fieldErrors.entries && (
              <span className="text-xs text-red-500">{fieldErrors.entries}</span>
            )}

            {/* table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
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

              {accountsLoading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  Загрузка счетов...
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[1fr_1fr_9rem_2.5rem] ${
                      index < entries.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="px-3 py-2.5">
                      <AccountSelect
                        value={entry.debit}
                        onChange={(v) => updateEntry(entry.id, 'debit', v)}
                        accounts={accounts}
                        hasError={!!fieldErrors[`d${entry.id}`]}
                      />
                    </div>
                    <div className="px-3 py-2.5 border-l border-gray-100">
                      <AccountSelect
                        value={entry.credit}
                        onChange={(v) => updateEntry(entry.id, 'credit', v)}
                        accounts={accounts}
                        hasError={!!fieldErrors[`c${entry.id}`]}
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
                        className={`
                          w-full text-sm border rounded-md bg-white text-gray-700 px-2 py-2 text-right
                          tabular-nums focus:outline-none focus:ring-1 transition-colors
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                          [&::-webkit-inner-spin-button]:appearance-none
                          ${fieldErrors[`a${entry.id}`]
                            ? 'border-red-300 focus:ring-red-300 focus:border-red-300'
                            : 'border-gray-200 focus:ring-blue-300 focus:border-blue-300'
                          }
                        `}
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
                ))
              )}
            </div>

            {/* totals */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Итого по проводкам
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Дебет</p>
                  <p className="text-sm font-semibold text-gray-800 tabular-nums">
                    {totalDebit.toLocaleString('ru-RU')} ₸
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Кредит</p>
                  <p className="text-sm font-semibold text-gray-800 tabular-nums">
                    {totalCredit.toLocaleString('ru-RU')} ₸
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Разница</p>
                  <p className={`text-sm font-semibold tabular-nums ${
                    difference > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {difference.toLocaleString('ru-RU')} ₸
                  </p>
                </div>
              </div>
            </div>

            {/* balance warning */}
            {!balanced && (totalDebit > 0 || totalCredit > 0) && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-amber-800">
                  Баланс не соблюден: Дебет ≠ Кредит
                </span>
              </div>
            )}
          </div>

          {/* ── actions ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={submitting}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Сохранение...' : 'Сохранить черновик'}
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={!canPost}
              title={!balanced ? 'Баланс не соблюден' : hasFieldErrors ? 'Заполните обязательные поля' : undefined}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              Провести операцию
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
