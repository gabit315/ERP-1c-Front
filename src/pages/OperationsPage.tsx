import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronRight, Plus, CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { getOperations, type OperationItem } from '../api/operations'
import { getAccounts, type Account } from '../api/accounts'
import CreateOperationPage from './CreateOperationPage'

// ─── mock fallback (shown when API returns no data) ───────────────────────────
// Removed when backend reliably returns is_posted + total_amount + counterparty_name

const MOCK_OPS: OperationItem[] = [
  {
    id: 124, date: '17.03.2026', dateRaw: '2026-03-17',
    number: 'ОП-00124', description: 'Оплата коммунальных услуг за март',
    entriesCount: 1, isPosted: true,
    counterpartyName: 'ТОО "Энергосбыт"', totalAmount: 125_000,
  },
  {
    id: 123, date: '17.03.2026', dateRaw: '2026-03-17',
    number: 'ОП-00123', description: 'Поступление оплаты за обучение от родителей',
    entriesCount: 1, isPosted: true,
    counterpartyName: 'Родители учеников', totalAmount: 850_000,
  },
  {
    id: 122, date: '16.03.2026', dateRaw: '2026-03-16',
    number: 'ОП-00122', description: 'Выплата заработной платы преподавателям',
    entriesCount: 1, isPosted: true,
    counterpartyName: 'Сотрудники', totalAmount: 1_200_000,
  },
  {
    id: 121, date: '15.03.2026', dateRaw: '2026-03-15',
    number: 'ОП-00121', description: 'Покупка канцелярских товаров и учебных материалов',
    entriesCount: 2, isPosted: true,
    counterpartyName: 'ТОО "Канцтовары"', totalAmount: 77_000,
  },
  {
    id: 120, date: '14.03.2026', dateRaw: '2026-03-14',
    number: 'ОП-00120', description: 'Аренда помещения за март',
    entriesCount: 1, isPosted: false,
    counterpartyName: 'ИП Иванов И.И.', totalAmount: 450_000,
  },
  {
    id: 119, date: '14.03.2026', dateRaw: '2026-03-14',
    number: 'ОП-00119', description: 'Закупка учебных пособий',
    entriesCount: 1, isPosted: false,
    counterpartyName: 'ТОО "Книжный мир"', totalAmount: 85_000,
  },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function entriesLabel(n: number): string {
  if (n === 1) return '1 проводка'
  if (n >= 2 && n <= 4) return `${n} проводки`
  return `${n} проводок`
}

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₸'
}

// ─── OperationListItem ────────────────────────────────────────────────────────

function OperationListItem({ item }: { item: OperationItem }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-default">

      {/* date + number */}
      <div className="w-32 shrink-0">
        <div className="text-xs text-gray-400 tabular-nums">{item.date}</div>
        <div className="text-sm font-medium text-blue-600 mt-0.5">{item.number}</div>
      </div>

      {/* description + counterparty */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{item.description}</div>
        {item.counterpartyName && (
          <div className="text-xs text-gray-400 truncate mt-0.5">{item.counterpartyName}</div>
        )}
      </div>

      {/* amount + entry count */}
      <div className="shrink-0 text-right">
        {item.totalAmount > 0 && (
          <div className="text-sm font-semibold text-gray-900 tabular-nums">
            {formatMoney(item.totalAmount)}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-0.5">{entriesLabel(item.entriesCount)}</div>
      </div>

      <ChevronRight size={15} className="text-gray-300 shrink-0" />
    </div>
  )
}

// ─── List view ────────────────────────────────────────────────────────────────

function OperationsListView({ onCreateClick }: { onCreateClick: () => void }) {

  // ── data ──────────────────────────────────────────────────────────────────
  const [apiOps, setApiOps]       = useState<OperationItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [accounts, setAccounts]   = useState<Account[]>([])

  // ── filters ───────────────────────────────────────────────────────────────
  const [tab, setTab]                     = useState<'posted' | 'drafts'>('posted')
  const [search, setSearch]               = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [cpFilter, setCpFilter]           = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')

  // ── load ──────────────────────────────────────────────────────────────────

  const load = () => {
    setLoading(true)
    setError(null)
    getOperations()
      .then(setApiOps)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getAccounts().then(setAccounts).catch(() => {})
  }, [])

  // Use API data if available, otherwise fall back to mock data
  const allOps = apiOps.length > 0 ? apiOps : (!loading && !error ? MOCK_OPS : apiOps)

  // ── derived stats ─────────────────────────────────────────────────────────

  const posted = useMemo(() => allOps.filter((o) => o.isPosted),  [allOps])
  const drafts  = useMemo(() => allOps.filter((o) => !o.isPosted), [allOps])
  const postedSum = useMemo(() => posted.reduce((s, o) => s + o.totalAmount, 0), [posted])

  // ── filtered list ─────────────────────────────────────────────────────────

  const visibleOps = useMemo(() => {
    let list = tab === 'posted' ? posted : drafts

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.counterpartyName.toLowerCase().includes(q),
      )
    }

    const cp = cpFilter.trim().toLowerCase()
    if (cp) list = list.filter((o) => o.counterpartyName.toLowerCase().includes(cp))

    // account filter: no account codes on OperationItem yet — filter applied when backend adds them
    if (dateFrom) list = list.filter((o) => o.dateRaw >= dateFrom)
    if (dateTo)   list = list.filter((o) => o.dateRaw <= dateTo)

    return list
  }, [tab, posted, drafts, search, cpFilter, dateFrom, dateTo])

  // ── field style ───────────────────────────────────────────────────────────

  const fieldCls =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 ' +
    'placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-5xl mx-auto flex flex-col gap-5">

        {/* ── header row ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Операции</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Управление хозяйственными операциями и проводками
            </p>
          </div>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            <Plus size={15} />
            Создать операцию
          </button>
        </div>

        {/* ── inline stats row ──────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-gray-500">Всего:</span>
            <span className="font-semibold text-gray-800">{allOps.length}</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-gray-500">Проведено:</span>
            <span className="font-semibold text-gray-800">{posted.length}</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-gray-500">Черновиков:</span>
            <span className="font-semibold text-gray-800">{drafts.length}</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-gray-500">Сумма проведенных:</span>
            <span className="font-semibold text-gray-800">{formatMoney(postedSum)}</span>
          </div>
        )}

        {/* ── status banner ─────────────────────────────────────────────── */}
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2.5">
          <CheckCircle2 size={15} className="text-green-600 shrink-0" />
          <span className="text-sm font-medium text-green-800">Данные актуальны</span>
          <span className="text-sm text-green-600">
            · Последний пересчет: 17.03.2026 в 14:23
          </span>
        </div>

        {/* ── underline tabs ────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'posted' as const, label: 'Проведенные', count: posted.length },
            { id: 'drafts' as const, label: 'Черновики',   count: drafts.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* ── filters card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Фильтры</span>
          </div>

          <div className="flex flex-col gap-3">

            {/* search — full width */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по описанию, номеру или контрагенту..."
                className={`${fieldCls} pl-9`}
              />
            </div>

            {/* row: account · counterparty · period */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">

              {/* account */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Счет</label>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className={fieldCls}
                >
                  <option value="">Все счета</option>
                  {accounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* counterparty */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Контрагент</label>
                <input
                  type="text"
                  value={cpFilter}
                  onChange={(e) => setCpFilter(e.target.value)}
                  placeholder="Название контрагента..."
                  className={fieldCls}
                />
              </div>

              {/* period: two date inputs inline */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Период</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`${fieldCls} w-36`}
                  />
                  <span className="text-gray-400 text-sm shrink-0">—</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`${fieldCls} w-36`}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-10 text-center text-sm text-gray-400">
            Загрузка...
          </div>
        ) : error ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-10 flex flex-col items-center gap-3">
            <span className="text-sm text-red-500">{error}</span>
            <button onClick={load} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Повторить
            </button>
          </div>
        ) : visibleOps.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-10 text-center text-sm text-gray-400">
            Ничего не найдено
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleOps.map((item) => (
              <OperationListItem key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── page root ────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const [view, setView] = useState<'list' | 'create'>('list')

  if (view === 'create') {
    return <CreateOperationPage onBack={() => setView('list')} />
  }

  return <OperationsListView onCreateClick={() => setView('create')} />
}
