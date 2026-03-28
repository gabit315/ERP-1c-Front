import { useState, useMemo, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import SearchCard from '../components/ui/SearchCard'
import RowActions from '../components/ui/RowActions'
import { getEmployees, type Employee } from '../api/employees'

function EmployeesTable({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: Employee[]
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    getEmployees()
      .then(setEmployees)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.iin.includes(q)
    )
  }, [query, employees])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Сотрудники"
          subtitle="Управление штатом сотрудников"
          action={
            <button
              disabled
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
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

        <EmployeesTable
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={load}
        />

      </div>
    </div>
  )
}
