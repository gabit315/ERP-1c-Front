import { useRef, useState, useEffect } from 'react'
import { Sparkles, Upload, ArrowDownToLine, ArrowUpFromLine, Truck, Info, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { getCounterparties, type Counterparty } from '../api/counterparties'
import { getFinancialItems, type FinancialItem } from '../api/financialItems'
import { createDocument, analyzeDocument } from '../api/documents'

// ─── types ───────────────────────────────────────────────────────────────────

type DocType = 'income' | 'expense' | 'payment'

interface ValidationErrors {
  date?: string
  amount?: string
  counterparty?: string
  item?: string
  purpose?: string
}

// ─── input classes ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

const inputErrCls =
  'w-full px-3 py-2.5 text-sm border border-red-300 rounded-lg bg-gray-50 text-gray-700 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-300 transition-colors'

const moneyCls =
  inputCls +
  ' [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

const moneyErrCls =
  inputErrCls +
  ' [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

// ─── static configuration per document type ──────────────────────────────────

const TYPE_CFG = {
  income: {
    label: 'Поступление денег',
    Icon: ArrowDownToLine,
    dateLabel: 'Дата поступления',
    selectLabel: 'Контрагент',
    purposeLabel: 'Назначение платежа',
    card: {
      active: 'border-green-500 bg-green-50',
      iconBg: 'bg-green-100 text-green-600',
      text: 'text-green-700',
    },
    entry: {
      wrap: 'bg-green-50 border border-green-200',
      title: 'text-green-700',
      body: 'text-green-800',
      debit: '1030 (Денежные средства на счетах)',
      credit: '6010 (Доход от реализации)',
    },
  },
  expense: {
    label: 'Списание денег',
    Icon: ArrowUpFromLine,
    dateLabel: 'Дата списания',
    selectLabel: 'Статья расхода',
    purposeLabel: 'Назначение',
    card: {
      active: 'border-red-500 bg-red-50',
      iconBg: 'bg-red-100 text-red-600',
      text: 'text-red-700',
    },
    entry: {
      wrap: 'bg-red-50 border border-red-200',
      title: 'text-red-700',
      body: 'text-red-800',
    },
  },
  payment: {
    label: 'Оплата поставщику',
    Icon: Truck,
    dateLabel: 'Дата оплаты',
    selectLabel: 'Поставщик',
    purposeLabel: 'Назначение платежа',
    card: {
      active: 'border-orange-500 bg-orange-50',
      iconBg: 'bg-orange-100 text-orange-600',
      text: 'text-orange-700',
    },
    entry: {
      wrap: 'bg-orange-50 border border-orange-200',
      title: 'text-orange-700',
      body: 'text-orange-800',
      debit: '2410 (Кредиторская задолженность поставщикам)',
      credit: '1030 (Денежные средства на счетах)',
    },
  },
} as const

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CreateDocumentPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // form state
  const [showUpload, setShowUpload] = useState(false)
  const [docType, setDocType]             = useState<DocType>('income')
  const [date, setDate]                   = useState('')
  const [amount, setAmount]               = useState('')
  const [counterpartyId, setCounterpartyId] = useState('')
  const [itemId, setItemId]               = useState('')   // expense mode
  const [purpose, setPurpose]             = useState('')

  // counterparties (income / payment)
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [cpLoading, setCpLoading]   = useState(true)
  const [cpError, setCpError]       = useState<string | null>(null)

  // expense items
  const [expenseItems, setExpenseItems]     = useState<FinancialItem[]>([])
  const [expLoading, setExpLoading]         = useState(false)
  const [expError, setExpError]             = useState<string | null>(null)
  const [expLoaded, setExpLoaded]           = useState(false)  // lazy-load guard

  // submit
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // AI analyze
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)

  // validation
  const [errors, setErrors] = useState<ValidationErrors>({})

  const cfg = TYPE_CFG[docType]

  // ─── selected expense item (for auto-entry hint) ──────────────────────────

  const selectedExpenseItem = expenseItems.find((i) => String(i.id) === itemId) ?? null

  const expenseDebit = selectedExpenseItem?.defaultAccountCode
    ? `${selectedExpenseItem.defaultAccountCode} (${selectedExpenseItem.name})`
    : selectedExpenseItem
    ? selectedExpenseItem.name
    : '— (Выберите статью расхода)'

  // ─── load counterparties ──────────────────────────────────────────────────

  const loadCounterparties = () => {
    setCpLoading(true)
    setCpError(null)
    getCounterparties()
      .then(setCounterparties)
      .catch((e: unknown) => {
        setCpError(e instanceof Error ? e.message : 'Ошибка загрузки контрагентов')
      })
      .finally(() => setCpLoading(false))
  }

  useEffect(() => {
    loadCounterparties()
  }, [])

  // ─── load expense items (lazy — on first switch to expense) ──────────────

  const loadExpenseItems = () => {
    setExpLoading(true)
    setExpError(null)
    getFinancialItems()
      .then((items) => {
        setExpenseItems(items.filter((i) => i.itemType === 'expense'))
        setExpLoaded(true)
      })
      .catch((e: unknown) => {
        setExpError(e instanceof Error ? e.message : 'Ошибка загрузки статей расходов')
      })
      .finally(() => setExpLoading(false))
  }

  useEffect(() => {
    if (docType === 'expense' && !expLoaded) {
      loadExpenseItems()
    }
  }, [docType, expLoaded])

  // ─── helpers ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setDate('')
    setAmount('')
    setCounterpartyId('')
    setItemId('')
    setPurpose('')
    setErrors({})
    setSubmitError(null)
    setAiError(null)
  }

  const handleTypeChange = (t: DocType) => {
    setDocType(t)
    resetForm()
    setSubmitSuccess(false)
  }

  // ─── AI file analyze ──────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setAiLoading(true)
    setAiError(null)

    analyzeDocument(file)
      .then((result) => {
        if (result.document_type && Object.keys(TYPE_CFG).includes(result.document_type)) {
          setDocType(result.document_type)
        }
        if (result.document_date) setDate(result.document_date.slice(0, 10))
        if (result.amount && result.amount > 0) setAmount(String(result.amount))
        if (result.purpose) setPurpose(result.purpose)

        const resolvedType = result.document_type ?? docType
        if (resolvedType === 'expense') {
          // match expense item
          if (result.item_id) {
            const found = expenseItems.find((i) => i.id === result.item_id)
            if (found) setItemId(String(found.id))
          }
        } else {
          // match counterparty; for payment — search only among suppliers
          const pool =
            resolvedType === 'payment'
              ? counterparties.filter((c) => c.type === 'supplier')
              : counterparties
          if (result.counterparty_id) {
            const found = pool.find((c) => c.id === result.counterparty_id)
            if (found) setCounterpartyId(String(found.id))
          } else if (result.counterparty_name) {
            const match = pool.find((c) =>
              c.name.toLowerCase().includes(result.counterparty_name!.toLowerCase())
            )
            if (match) setCounterpartyId(String(match.id))
          }
        }
        setShowUpload(false)
      })
      .catch((e: unknown) => {
        setAiError(e instanceof Error ? e.message : 'Ошибка AI-анализа файла')
      })
      .finally(() => setAiLoading(false))
  }

  // ─── validation ───────────────────────────────────────────────────────────

  const validate = (): ValidationErrors => {
    const errs: ValidationErrors = {}
    if (!date) errs.date = 'Укажите дату документа'
    if (!amount || Number(amount) <= 0) errs.amount = 'Сумма должна быть больше 0'
    if (docType === 'expense') {
      if (!itemId) errs.item = 'Выберите статью расхода'
    } else {
      if (!counterpartyId)
        errs.counterparty = docType === 'payment' ? 'Выберите поставщика' : 'Выберите контрагента'
      if (!purpose.trim()) errs.purpose = 'Укажите назначение'
    }
    return errs
  }

  // ─── submit ───────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    const payload =
      docType === 'expense'
        ? {
            document_type: 'expense' as const,
            document_date: date,
            amount: Number(amount),
            item_id: Number(itemId),
            purpose: purpose.trim() || undefined,
          }
        : {
            document_type: docType,
            document_date: date,
            amount: Number(amount),
            counterparty_id: Number(counterpartyId),
            purpose: purpose.trim(),
          }

    createDocument(payload)
      .then(() => {
        setSubmitSuccess(true)
        resetForm()
      })
      .catch((e: unknown) => {
        setSubmitError(e instanceof Error ? e.message : 'Ошибка создания документа')
      })
      .finally(() => setSubmitting(false))
  }

  // ─── derived flags & lists ───────────────────────────────────────────────

  const selectLoading = docType === 'expense' ? expLoading : cpLoading
  const selectError   = docType === 'expense' ? expError   : cpError

  // payment mode shows only suppliers; income mode shows all counterparties
  const selectableCounterparties =
    docType === 'payment'
      ? counterparties.filter((c) => c.type === 'supplier')
      : counterparties

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeader
          title="Создание документа"
          subtitle="Быстрое создание кассовых и финансовых документов"
        />

        {/* Success banner */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium">
            Документ успешно создан.
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        {/* Counterparties / items load error */}
        {selectError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-600">{selectError}</span>
            <button
              onClick={docType === 'expense' ? loadExpenseItems : loadCounterparties}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline ml-4 shrink-0"
            >
              Повторить
            </button>
          </div>
        )}

        {/* ── main card ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">

          {/* AI upload trigger + panel */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => setShowUpload((v) => !v)}
              className="self-start flex items-center gap-2 text-sm font-medium text-white px-4 py-2.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
            >
              <Sparkles size={15} />
              {aiLoading ? 'Анализирую...' : 'Загрузить документ с AI обработкой'}
            </button>

            {showUpload && (
              <div className="border border-gray-200 rounded-lg p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Умная обработка документов
                    </h3>
                    <p className="text-xs text-gray-500">
                      Загрузите скан или фотографию документа для автоматического распознавания данных
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 ml-4"
                  >
                    <X size={15} />
                  </button>
                </div>

                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-lg py-10 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                  <Upload size={28} className="text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      Перетащите файл или нажмите для загрузки
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Поддерживаются: PDF, JPG, PNG (макс. 10 МБ)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {aiError && (
                  <p className="text-xs text-red-500">{aiError}</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* ── type selector ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-600">Тип операции</label>
            <div className="flex gap-3">
              {(Object.keys(TYPE_CFG) as DocType[]).map((t) => {
                const c = TYPE_CFG[t]
                const active = docType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      active
                        ? c.card.active
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        active ? c.card.iconBg : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <c.Icon size={18} />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        active ? c.card.text : 'text-gray-600'
                      }`}
                    >
                      {c.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── dynamic form ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* date + amount */}
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">{cfg.dateLabel}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })) }}
                  className={errors.date ? inputErrCls : inputCls}
                />
                {errors.date && <span className="text-xs text-red-500">{errors.date}</span>}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Сумма (₸)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: undefined })) }}
                  placeholder="0.00"
                  className={errors.amount ? moneyErrCls : moneyCls}
                />
                {errors.amount && <span className="text-xs text-red-500">{errors.amount}</span>}
              </div>
            </div>

            {/* dynamic select: expense items OR counterparties */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">{cfg.selectLabel}</label>
              {selectLoading ? (
                <div className={inputCls + ' text-gray-400'}>
                  {docType === 'expense' ? 'Загрузка статей расходов...' : 'Загрузка контрагентов...'}
                </div>
              ) : docType === 'expense' ? (
                <select
                  value={itemId}
                  onChange={(e) => { setItemId(e.target.value); setErrors((p) => ({ ...p, item: undefined })) }}
                  className={errors.item ? inputErrCls : inputCls}
                >
                  <option value="">Выберите статью...</option>
                  {expenseItems.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}{item.category !== '—' ? ` — ${item.category}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={counterpartyId}
                  onChange={(e) => { setCounterpartyId(e.target.value); setErrors((p) => ({ ...p, counterparty: undefined })) }}
                  className={errors.counterparty ? inputErrCls : inputCls}
                >
                  <option value="">Выберите...</option>
                  {selectableCounterparties.map((cp) => (
                    <option key={cp.id} value={String(cp.id)}>
                      {cp.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.item && <span className="text-xs text-red-500">{errors.item}</span>}
              {errors.counterparty && <span className="text-xs text-red-500">{errors.counterparty}</span>}
            </div>

            {/* purpose */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">{cfg.purposeLabel}</label>
              <textarea
                value={purpose}
                onChange={(e) => { setPurpose(e.target.value); setErrors((p) => ({ ...p, purpose: undefined })) }}
                rows={3}
                placeholder="Введите назначение..."
                className={(errors.purpose ? inputErrCls : inputCls) + ' resize-none'}
              />
              {errors.purpose && <span className="text-xs text-red-500">{errors.purpose}</span>}
            </div>

            {/* auto-entry box — color keyed to doc type */}
            {docType === 'expense' ? (
              <div className={`rounded-lg px-4 py-3 flex flex-col gap-1 ${cfg.entry.wrap}`}>
                <p className={`text-xs font-semibold ${cfg.entry.title}`}>
                  Автоматическая проводка:
                </p>
                <p className={`text-xs ${cfg.entry.body}`}>
                  Дебет: {expenseDebit}
                </p>
                <p className={`text-xs ${cfg.entry.body}`}>
                  Кредит: 1030 (Денежные средства на счетах)
                </p>
              </div>
            ) : (
              <div className={`rounded-lg px-4 py-3 flex flex-col gap-1 ${cfg.entry.wrap}`}>
                <p className={`text-xs font-semibold ${cfg.entry.title}`}>
                  Автоматическая проводка:
                </p>
                <p className={`text-xs ${cfg.entry.body}`}>Дебет: {cfg.entry.debit}</p>
                <p className={`text-xs ${cfg.entry.body}`}>Кредит: {cfg.entry.credit}</p>
              </div>
            )}

          </div>

          {/* ── bottom note ───────────────────────────────────────────── */}
          <div className="flex gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <Info size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Примечание:</span>{' '}
              Документы автоматически создают проводки по стандартным шаблонам. Для сложных
              операций используйте раздел «Операции».
            </p>
          </div>

          {/* ── actions ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={submitting}
              onClick={() => { resetForm(); setSubmitSuccess(false) }}
              className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={submitting || selectLoading}
              onClick={handleSubmit}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Создание...' : 'Создать документ'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
