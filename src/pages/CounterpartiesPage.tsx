import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import SearchCard from '../components/ui/SearchCard'
import StatusBadge from '../components/ui/StatusBadge'
import RowActions from '../components/ui/RowActions'

type CounterpartyType = 'supplier' | 'buyer'

interface Counterparty {
  id: string
  name: string
  bin: string
  type: CounterpartyType
  contact: string
}

const data: Counterparty[] = [
  {
    id: '1',
    name: 'ТОО "Строительная компания"',
    bin: '123456789012',
    type: 'supplier',
    contact: '+7 701 234 5678',
  },
  {
    id: '2',
    name: 'ИП Иванов И.И.',
    bin: '987654321098',
    type: 'supplier',
    contact: '+7 702 345 6789',
  },
  {
    id: '3',
    name: 'Родители учеников',
    bin: '—',
    type: 'buyer',
    contact: '—',
  },
  {
    id: '4',
    name: 'ТОО "Канцелярские товары"',
    bin: '456789123456',
    type: 'supplier',
    contact: '+7 703 456 7890',
  },
]

function CounterpartiesTable({ rows }: { rows: Counterparty[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3">
              Название
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-44">
              БИН/ИИН
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Тип
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-48">
              Контакт
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
                Ничего не найдено
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3.5 text-gray-800 font-medium">
                  {row.name}
                </td>
                <td className="px-4 py-3.5 font-mono text-gray-600 text-sm">
                  {row.bin}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge
                    label={row.type === 'supplier' ? 'Поставщик' : 'Покупатель'}
                    variant={row.type}
                  />
                </td>
                <td className="px-4 py-3.5 text-gray-600">
                  {row.contact}
                </td>
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

export default function CounterpartiesPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.bin.includes(q) ||
        c.contact.includes(q)
    )
  }, [query])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Контрагенты"
          subtitle="Управление поставщиками и покупателями"
          action={
            <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} />
              Добавить контрагента
            </button>
          }
        />

        <SearchCard
          value={query}
          onChange={setQuery}
          placeholder="Поиск контрагентов..."
        />

        <CounterpartiesTable rows={filtered} />

      </div>
    </div>
  )
}
