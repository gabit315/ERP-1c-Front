import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { getOperations, type OperationItem } from '../api/operations'

// ─── period config ─────────────────────────────────────────────────────────────

const PERIODS = ['Март 2026', 'Февраль 2026', 'Январь 2026', 'Весь период'] as const
type Period = (typeof PERIODS)[number]

// map label -> { year, month } for filtering; null = show all
const PERIOD_FILTER: Record<Period, { year: number; month: number } | null> = {
  'Март 2026':    { year: 2026, month: 3 },
  'Февраль 2026': { year: 2026, month: 2 },
  'Январь 2026':  { year: 2026, month: 1 },
  'Весь период':  null,
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function entriesLabel(n: number): string {
  if (n === 1) return '1 проводка'
  if (n >= 2 && n <= 4) return `${n} проводки`
  return `${n} проводок`
}

// ─── sub-components ───────────────────────────────────────────────────────────

function JournalRow({ item }: { item: OperationItem }) {
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
        {entriesLabel(item.entriesCount)}
      </span>

      {/* chevron */}
      <ChevronRight size={15} className="text-gray-300 shrink-0" />
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OperationsJournalPage() {
  const [operations, setOperations] = useState<OperationItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [query, setQuery]   = useState('')
  const [period, setPeriod] = useState<Period>('Март 2026')

  // ─── load ──────────────────────────────────────────────────────────────────

  const load = () => {
    setLoading(true)
    setError(null)
    getOperations()
      .then(setOperations)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  // ─── filter + search ───────────────────────────────────────────────────────

  const rows = useMemo(() => {
    let list = operations

    // period filter
    const pf = PERIOD_FILTER[period]
    if (pf) {
      list = list.filter((op) => {
        const m = /^(\d{4})-(\d{2})/.exec(op.dateRaw)
        if (!m) return false
        return Number(m[1]) === pf.year && Number(m[2]) === pf.month
      })
    }

    // search
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (op) =>
          op.number.toLowerCase().includes(q) ||
          op.description.toLowerCase().includes(q)
      )
    }

    return list
  }, [operations, query, period])

  // ─── render ────────────────────────────────────────────────────────────────

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
                onChange={(e) => setPeriod(e.target.value as Period)}
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
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center text-sm text-gray-400">
              Загрузка...
            </div>
          ) : error ? (
            <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 flex flex-col items-center gap-3">
              <span className="text-sm text-red-500">{error}</span>
              <button
                onClick={load}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Повторить
              </button>
            </div>
          ) : rows.length === 0 ? (
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
