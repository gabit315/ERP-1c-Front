import { useState, useMemo } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

// ─── data ─────────────────────────────────────────────────────────────────────

interface JournalItem {
  id: string
  date: string
  number: string
  description: string
  entriesCount: number
}

const DATA: JournalItem[] = [
  {
    id: '1',
    date: '17.03.2026',
    number: 'ОП-00124',
    description: 'Оплата коммунальных услуг за март',
    entriesCount: 2,
  },
  {
    id: '2',
    date: '17.03.2026',
    number: 'ОП-00123',
    description: 'Поступление оплаты за обучение',
    entriesCount: 1,
  },
  {
    id: '3',
    date: '16.03.2026',
    number: 'ОП-00122',
    description: 'Выплата заработной платы преподавателям',
    entriesCount: 1,
  },
  {
    id: '4',
    date: '15.03.2026',
    number: 'ОП-00121',
    description: 'Покупка канцелярских товаров и мебели',
    entriesCount: 2,
  },
]

const PERIODS = ['Март 2026', 'Февраль 2026', 'Январь 2026', 'Весь период']

// ─── sub-components ───────────────────────────────────────────────────────────

function JournalRow({ item }: { item: JournalItem }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-default">
      {/* date */}
      <span className="text-sm text-gray-400 w-24 shrink-0 tabular-nums">
        {item.date}
      </span>

      {/* operation number — blue link style */}
      <span className="text-sm font-medium text-blue-600 w-28 shrink-0">
        {item.number}
      </span>

      {/* description */}
      <span className="flex-1 text-sm text-gray-700 truncate">
        {item.description}
      </span>

      {/* entry count */}
      <span className="text-xs text-gray-400 shrink-0">
        {item.entriesCount} проводок
      </span>

      {/* chevron */}
      <ChevronRight size={15} className="text-gray-300 shrink-0" />
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OperationsJournalPage() {
  const [query, setQuery]   = useState('')
  const [period, setPeriod] = useState('Март 2026')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DATA
    return DATA.filter(
      (item) =>
        item.description.toLowerCase().includes(q) ||
        item.number.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeader
          title="Журнал операций"
          subtitle="История всех хозяйственных операций и проводок"
        />

        {/* ── filter card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <div className="flex gap-4">

            {/* search */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Поиск</label>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по описанию или номеру..."
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

            {/* period */}
            <div className="w-48 flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-medium text-gray-600">Период</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="
                  w-full px-3 py-2.5 text-sm
                  border border-gray-200 rounded-lg
                  bg-gray-50 text-gray-700
                  focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300
                  transition-colors
                "
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* ── journal list ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          {rows.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center text-sm text-gray-400">
              Ничего не найдено
            </div>
          ) : (
            rows.map((item) => <JournalRow key={item.id} item={item} />)
          )}
        </div>

      </div>
    </div>
  )
}
