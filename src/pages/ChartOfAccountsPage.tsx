import { useState, useMemo } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

type AccountType = 'active' | 'passive'

interface Account {
  code: string
  name: string
  type: AccountType
  balance: string
}

const accounts: Account[] = [
  { code: '1010', name: 'Денежные средства в кассе',                                    type: 'active',  balance: '450 000 ₸'    },
  { code: '1030', name: 'Денежные средства на счетах в банках',                         type: 'active',  balance: '15 000 000 ₸' },
  { code: '1210', name: 'Краткосрочная дебиторская задолженность покупателей',           type: 'active',  balance: '2 300 000 ₸'  },
  { code: '1250', name: 'Авансы выданные',                                              type: 'active',  balance: '180 000 ₸'    },
  { code: '1310', name: 'Сырье и материалы',                                            type: 'active',  balance: '560 000 ₸'    },
  { code: '2410', name: 'Краткосрочная кредиторская задолженность поставщикам',          type: 'passive', balance: '1 200 000 ₸'  },
  { code: '3010', name: 'Уставной капитал',                                             type: 'passive', balance: '5 000 000 ₸'  },
  { code: '5010', name: 'Себестоимость реализованных товаров',                           type: 'active',  balance: '3 200 000 ₸'  },
  { code: '6010', name: 'Доход от реализации продукции',                                type: 'passive', balance: '8 500 000 ₸'  },
  { code: '7110', name: 'Расходы по заработной плате',                                  type: 'active',  balance: '4 100 000 ₸'  },
  { code: '7210', name: 'Расходы на аренду',                                            type: 'active',  balance: '850 000 ₸'    },
]

function AccountsTable({ rows }: { rows: Account[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-32">
              Код счета
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3">
              Название
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Тип
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-44">
              Остаток
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-36">
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
            rows.map((account, i) => (
              <tr
                key={account.code}
                className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                  i % 2 === 0 ? '' : ''
                }`}
              >
                <td className="px-5 py-3.5">
                  <span className="font-mono text-sm font-medium text-gray-700">
                    {account.code}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-700">
                  {account.name}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge
                    label={account.type === 'active' ? 'Активный' : 'Пассивный'}
                    variant={account.type === 'active' ? 'active' : 'passive'}
                  />
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-gray-700 tabular-nums">
                  {account.balance}
                </td>
                <td className="px-5 py-3.5">
                  <button className="flex items-center gap-0.5 text-blue-600 hover:text-blue-700 text-sm transition-colors">
                    Подробнее
                    <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function ChartOfAccountsPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter(
      (a) =>
        a.code.includes(q) ||
        a.name.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeader
          title="План счетов"
          subtitle="Предзагруженный план счетов Республики Казахстан"
        />

        {/* Search card */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по коду или названию счета..."
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

        <AccountsTable rows={filtered} />

      </div>
    </div>
  )
}
