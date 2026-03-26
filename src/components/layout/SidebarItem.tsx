import { ChevronDown, ChevronRight } from 'lucide-react'

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed: boolean
  hasChildren?: boolean
  isOpen?: boolean
  onClick: () => void
}

export default function SidebarItem({
  icon,
  label,
  active,
  collapsed,
  hasChildren,
  isOpen,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2.5 text-sm
        rounded-lg transition-colors
        ${active
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      <span className={`shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
        {icon}
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {hasChildren && (
            <span className={`shrink-0 transition-colors ${active ? 'text-blue-400' : 'text-gray-300'}`}>
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          )}
        </>
      )}
    </button>
  )
}
