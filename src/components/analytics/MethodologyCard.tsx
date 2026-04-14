import { Info } from 'lucide-react'

interface MethodologyItem {
  term:        string
  description: string
}

interface MethodologyCardProps {
  items?: MethodologyItem[]
}

const DEFAULT_ITEMS: MethodologyItem[] = [
  { term: 'Прогноз',  description: 'Скользящее среднее за последние 3 месяца + линейный тренд'   },
  { term: 'Аномалия', description: 'Отклонение более чем на 30% от среднего или выше 2× нормы'   },
  { term: 'Тренд',    description: 'Линейная регрессия по фактическим данным за выбранный период' },
]

export default function MethodologyCard({ items = DEFAULT_ITEMS }: MethodologyCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Info size={13} className="text-gray-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-600">Методология прогнозирования</span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        {items.map((it) => (
          <div key={it.term} className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-gray-700 shrink-0">{it.term}:</span>
            <span className="text-xs text-gray-500">{it.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
