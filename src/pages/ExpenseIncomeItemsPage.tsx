import { useState, useMemo, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import RowActions from '../components/ui/RowActions'
import { getFinancialItems, type FinancialItem } from '../api/financialItems'

type Tab = 'expenses' | 'income'

const tabs: { id: Tab; label: string }[] = [
  { id: 'expenses', label: 'Расходы' },
  { id: 'income',   label: 'Доходы'  },
]

function ItemsTable({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: FinancialItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
        <span className="text-sm text-gray-400">Загрузка...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-sm text-red-500">{error}</span>
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3">
              Название
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-64">
              Категория
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-28">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center text-sm text-gray-400 py-12">
                Ничего не найдено
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3.5 text-gray-800 font-medium">{row.name}</td>
                <td className="px-4 py-3.5 text-gray-600">{row.category}</td>
                <td className="px-5 py-3.5">
                  <RowActions />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function ExpenseIncomeItemsPage() {
  const [items, setItems] = useState<FinancialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('expenses')
  const [query, setQuery] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    getFinancialItems()
      .then(setItems)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setQuery('')
  }

  const filtered = useMemo(() => {
    const tabItems = items.filter(
      (item) => item.itemType === (activeTab === 'expenses' ? 'expense' : 'income')
    )
    const q = query.trim().toLowerCase()
    if (!q) return tabItems
    return tabItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query, activeTab, items])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Статьи расходов и доходов"
          subtitle="Классификация финансовых операций"
          action={
            <button
              disabled
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Добавить статью
            </button>
          }
        />

        {/* Tabs + search combined card */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex-1 py-3 text-sm font-medium text-center transition-colors
                    ${isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск статей..."
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
        </div>

        <ItemsTable
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={load}
        />

      </div>
    </div>
  )
}
