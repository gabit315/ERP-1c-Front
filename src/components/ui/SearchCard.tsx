import { Search } from 'lucide-react'

interface SearchCardProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchCard({ value, onChange, placeholder = 'Поиск...' }: SearchCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-6 py-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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
  )
}
