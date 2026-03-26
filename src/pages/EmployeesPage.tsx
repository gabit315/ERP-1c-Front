import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import SearchCard from '../components/ui/SearchCard'
import RowActions from '../components/ui/RowActions'

interface Employee {
  id: string
  fullName: string
  position: string
  department: string
  iin: string
}

const data: Employee[] = [
  {
    id: '1',
    fullName: 'Иванова Анна Петровна',
    position: 'Преподаватель математики',
    department: 'Кафедра математики',
    iin: '850101350123',
  },
  {
    id: '2',
    fullName: 'Смирнов Петр Сергеевич',
    position: 'Декан факультета',
    department: 'Администрация',
    iin: '780505450234',
  },
  {
    id: '3',
    fullName: 'Кожахметова Айгуль Нурлановна',
    position: 'Лаборант',
    department: 'Химический факультет',
    iin: '920315550345',
  },
]

function EmployeesTable({ rows }: { rows: Employee[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3">
              ФИО
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3">
              Должность
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-52">
              Подразделение
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-44">
              ИИН
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
                <td className="px-5 py-3.5 text-gray-800 font-medium">{row.fullName}</td>
                <td className="px-4 py-3.5 text-gray-600">{row.position}</td>
                <td className="px-4 py-3.5 text-gray-600">{row.department}</td>
                <td className="px-4 py-3.5 font-mono text-gray-600">{row.iin}</td>
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

export default function EmployeesPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.iin.includes(q)
    )
  }, [query])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Сотрудники"
          subtitle="Управление штатом сотрудников"
          action={
            <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} />
              Добавить сотрудника
            </button>
          }
        />

        <SearchCard
          value={query}
          onChange={setQuery}
          placeholder="Поиск сотрудников..."
        />

        <EmployeesTable rows={filtered} />

      </div>
    </div>
  )
}
