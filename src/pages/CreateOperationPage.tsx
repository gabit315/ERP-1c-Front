import { useRef, useState } from 'react'
import { Sparkles, Trash2, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

interface EntryRow {
  id: number
  debit: string
  credit: string
  amount: string
}

const ACCOUNTS = [
  { code: '1010', name: 'Денежные средства в кассе' },
  { code: '1030', name: 'Денежные средства на счетах' },
  { code: '1210', name: 'Дебиторская задолженность' },
  { code: '7110', name: 'Расходы по зарплате' },
  { code: '7210', name: 'Расходы на аренду' },
  { code: '7310', name: 'Коммунальные расходы' },
]

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

const selectCls =
  'w-full text-sm border border-gray-200 rounded-md bg-white text-gray-700 px-2 py-2 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

function AccountSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      <option value="">Выберите счет...</option>
      {ACCOUNTS.map((a) => (
        <option key={a.code} value={a.code}>
          {a.code} - {a.name}
        </option>
      ))}
    </select>
  )
}

export default function CreateOperationPage() {
  const [date, setDate] = useState('2026-03-17')
  const [opNumber, setOpNumber] = useState('ОП-00124')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState<EntryRow[]>([
    { id: 1, debit: '', credit: '', amount: '' },
  ])
  const nextId = useRef(2)

  const addEntry = () => {
    setEntries((prev) => [...prev, { id: nextId.current++, debit: '', credit: '', amount: '' }])
  }

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const updateEntry = (id: number, field: keyof Omit<EntryRow, 'id'>, value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeader
          title="Создание операции"
          subtitle="Ядро системы: создание хозяйственных операций и проводок"
        />

        {/* Main form card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6">

          {/* Row 1: Date + Operation Number */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Дата операции</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Номер операции</label>
              <input
                type="text"
                value={opNumber}
                onChange={(e) => setOpNumber(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-600">Описание операции</label>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
              >
                <Sparkles size={14} />
                Заполнить с помощью ИИ
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Оплата коммунальных услуг за март 2026"
              rows={3}
              className={inputCls + ' resize-none'}
            />
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
              {entries.map((entry, index) => (
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
                    />
                  </div>
                  <div className="px-3 py-2.5 border-l border-gray-100">
                    <AccountSelect
                      value={entry.credit}
                      onChange={(v) => updateEntry(entry.id, 'credit', v)}
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
                      className="w-full text-sm border border-gray-200 rounded-md bg-white text-gray-700 px-2 py-2 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              ))}
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
              className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Сохранить операцию
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
