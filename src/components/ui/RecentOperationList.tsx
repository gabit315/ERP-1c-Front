type OperationType = 'income' | 'expense' | 'transfer'

export interface Operation {
  id: string
  date: string
  description: string
  amount: string
  type: OperationType
}

const typeLabels: Record<OperationType, string> = {
  income: 'Приход',
  expense: 'Расход',
  transfer: 'Перевод',
}

const typeBadgeStyles: Record<OperationType, string> = {
  income: 'bg-green-50 text-green-700',
  expense: 'bg-red-50 text-red-600',
  transfer: 'bg-gray-100 text-gray-600',
}

const amountStyles: Record<OperationType, string> = {
  income: 'text-green-700',
  expense: 'text-red-600',
  transfer: 'text-gray-700',
}

interface RecentOperationListProps {
  operations: Operation[]
}

export default function RecentOperationList({ operations }: RecentOperationListProps) {
  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {operations.map((op) => (
        <div key={op.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">{op.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">{op.date}</p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${typeBadgeStyles[op.type]}`}
          >
            {typeLabels[op.type]}
          </span>
          <span className={`text-sm font-medium shrink-0 w-28 text-right ${amountStyles[op.type]}`}>
            {op.type === 'income' ? '+' : op.type === 'expense' ? '−' : ''}{op.amount}
          </span>
        </div>
      ))}
    </div>
  )
}
