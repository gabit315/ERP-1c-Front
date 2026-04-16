import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import SearchCard from '../components/ui/SearchCard'
import RowActions from '../components/ui/RowActions'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api/employees'
import type { Employee, EmployeePayload } from '../api/employees'
import EmployeeEditPage from './EmployeeEditPage'

// ─── table ────────────────────────────────────────────────────────────────────

function EmployeesTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
}: {
  rows: Employee[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onEdit: (e: Employee) => void
  onDelete: (e: Employee) => void
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
                  <RowActions
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── form modal ───────────────────────────────────────────────────────────────

interface FormState {
  fullName: string
  position: string
  department: string
  iin: string
}

function EmployeeModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Employee | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = initial !== null

  const [form, setForm] = useState<FormState>({
    fullName: initial?.fullName ?? '',
    position: initial?.position ?? '',
    department: initial?.department ?? '',
    iin: initial?.iin ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) { setError('ФИО обязательно'); return }
    if (!form.position.trim()) { setError('Должность обязательна'); return }
    if (!form.department.trim()) { setError('Подразделение обязательно'); return }
    if (!form.iin.trim()) { setError('ИИН обязателен'); return }

    const payload: EmployeePayload = {
      full_name: form.fullName.trim(),
      position: form.position.trim(),
      department: form.department.trim(),
      iin: form.iin.trim(),
    }

    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        await updateEmployee(initial.id, payload)
      } else {
        await createEmployee(payload)
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Редактировать сотрудника' : 'Новый сотрудник'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              ФИО <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              disabled={submitting}
              placeholder="Иванов Иван Иванович"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Должность <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
              disabled={submitting}
              placeholder="Бухгалтер"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Подразделение <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              disabled={submitting}
              placeholder="Финансовый отдел"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              ИИН <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.iin}
              onChange={(e) => set('iin', e.target.value)}
              disabled={submitting}
              placeholder="123456789012"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  employee,
  onClose,
  onDeleted,
}: {
  employee: Employee
  onClose: () => void
  onDeleted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    try {
      await deleteEmployee(employee.id)
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-800">Удалить сотрудника?</h2>
        <p className="text-sm text-gray-600">
          Вы уверены, что хотите удалить{' '}
          <span className="font-medium text-gray-800">{employee.fullName}</span>?
          Это действие нельзя отменить.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={submitting}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [editPageTarget, setEditPageTarget] = useState<Employee | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getEmployees()
      .then(setEmployees)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

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

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(e: Employee) {
    setEditPageTarget(e)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleSaved() {
    closeModal()
    load()
  }

  function handleDeleted() {
    setDeleteTarget(null)
    load()
  }

  if (editPageTarget) {
    return (
      <EmployeeEditPage
        employee={editPageTarget}
        onBack={() => setEditPageTarget(null)}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeaderWithAction
          title="Сотрудники"
          subtitle="Управление штатом сотрудников"
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />

      </div>

      {modalOpen && (
        <EmployeeModal
          initial={editTarget}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          employee={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
