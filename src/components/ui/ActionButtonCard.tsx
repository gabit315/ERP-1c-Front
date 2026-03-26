interface ActionButtonCardProps {
  icon: React.ReactNode
  label: string
  description?: string
  onClick?: () => void
}

export default function ActionButtonCard({
  icon,
  label,
  description,
  onClick,
}: ActionButtonCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-3 w-full px-4 py-3
        border border-gray-200 rounded-lg bg-white
        hover:bg-gray-50 hover:border-gray-300
        transition-colors text-left
      "
    >
      <span className="text-blue-600 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700 leading-none">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1 truncate">{description}</p>
        )}
      </div>
    </button>
  )
}
