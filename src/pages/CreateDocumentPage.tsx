import { useState } from 'react'
import { Sparkles, Upload, ArrowDownToLine, ArrowUpFromLine, Truck, Info, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

// ─── types ───────────────────────────────────────────────────────────────────

type DocType = 'income' | 'expense' | 'payment'

// ─── shared input class (matches the rest of the design system) ───────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

const moneyCls =
  inputCls +
  ' [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

// ─── static configuration per document type ──────────────────────────────────

const TYPE_CFG = {
  income: {
    label: 'Поступление денег',
    Icon: ArrowDownToLine,
    dateLabel: 'Дата поступления',
    selectLabel: 'Контрагент',
    selectOptions: ['Родители учеников', 'Другой контрагент'],
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
    selectOptions: ['Коммунальные услуги', 'Канцелярские товары', 'Ремонт и обслуживание'],
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
      debit: '7310 (Расход по выбранной статье)',
      credit: '1030 (Денежные средства на счетах)',
    },
  },
  payment: {
    label: 'Оплата поставщику',
    Icon: Truck,
    dateLabel: 'Дата оплаты',
    selectLabel: 'Поставщик',
    selectOptions: [
      'ТОО "Строительная компания"',
      'ИП Иванов И.И.',
      'ТОО "Канцелярские товары"',
    ],
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
  const [showUpload, setShowUpload] = useState(false)
  const [docType, setDocType]       = useState<DocType>('income')
  const [date, setDate]             = useState('')
  const [amount, setAmount]         = useState('')
  const [selectVal, setSelectVal]   = useState('')
  const [purpose, setPurpose]       = useState('')

  const cfg = TYPE_CFG[docType]

  const handleTypeChange = (t: DocType) => {
    setDocType(t)
    setDate('')
    setAmount('')
    setSelectVal('')
    setPurpose('')
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeader
          title="Создание документа"
          subtitle="Быстрое создание кассовых и финансовых документов"
        />

        {/* ── main card ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">

          {/* AI upload trigger + panel */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className="self-start flex items-center gap-2 text-sm font-medium text-white px-4 py-2.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
            >
              <Sparkles size={15} />
              Загрузить документ с AI обработкой
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
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                </label>
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
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Сумма (₸)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={moneyCls}
                />
              </div>
            </div>

            {/* dynamic select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">{cfg.selectLabel}</label>
              <select
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                className={inputCls}
              >
                <option value="">Выберите...</option>
                {cfg.selectOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* purpose */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">{cfg.purposeLabel}</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                placeholder="Введите назначение..."
                className={inputCls + ' resize-none'}
              />
            </div>

            {/* auto-entry box — color keyed to doc type */}
            <div className={`rounded-lg px-4 py-3 flex flex-col gap-1 ${cfg.entry.wrap}`}>
              <p className={`text-xs font-semibold ${cfg.entry.title}`}>
                Автоматическая проводка:
              </p>
              <p className={`text-xs ${cfg.entry.body}`}>Дебет: {cfg.entry.debit}</p>
              <p className={`text-xs ${cfg.entry.body}`}>Кредит: {cfg.entry.credit}</p>
            </div>

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
              className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Создать документ
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
