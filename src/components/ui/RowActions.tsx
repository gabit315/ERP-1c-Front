import { Pencil, Trash2 } from 'lucide-react'

interface RowActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  disabled?: boolean
}

export default function RowActions({ onEdit, onDelete, disabled = false }: RowActionsProps) {
  if (disabled) {
    return (
      <div className="flex items-center gap-1" title="Функция временно недоступна">
        <span className="p-1.5 rounded text-blue-300 cursor-not-allowed opacity-50">
          <Pencil size={15} />
        </span>
        <span className="p-1.5 rounded text-red-300 cursor-not-allowed opacity-50">
          <Trash2 size={15} />
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        className="p-1.5 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
        title="Редактировать"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Удалить"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
