import { useState } from 'react'
import {
  Home,
  BookOpen,
  Users,
  ClipboardList,
  FileText,
  ScrollText,
  BarChart2,
  Activity,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
} from 'lucide-react'
import SidebarItem from './SidebarItem'

export type PageId =
  | 'dashboard'
  | 'chart-of-accounts'
  | 'counterparties'
  | 'employees'
  | 'expense-income-items'
  | 'operation-templates'
  | 'create-document'
  | 'incoming-invoices'
  | 'outgoing-invoices'
  | 'acts'
  | 'payment-orders'
  | 'cash-ops'
  | 'operations'
  | 'journal'
  | 'reports'
  | 'osv'
  | 'account-analysis'
  | 'general-summary'
  | 'analytics'
  | 'ai-analytics'
  | 'settings'
  | 'salary'

interface NavChild {
  label: string
  pageId: PageId
}

interface NavGroup {
  id: string
  icon: React.ReactNode
  label: string
  pageId?: PageId
  children?: NavChild[]
}

const navGroups: NavGroup[] = [
  {
    id: 'home',
    icon: <Home size={17} />,
    label: 'Главная',
    pageId: 'dashboard',
  },
  {
    id: 'chart-of-accounts',
    icon: <BookOpen size={17} />,
    label: 'План счетов',
    pageId: 'chart-of-accounts',
  },
  {
    id: 'refs',
    icon: <Users size={17} />,
    label: 'Справочники',
    children: [
      { label: 'Контрагенты',              pageId: 'counterparties'       },
      { label: 'Сотрудники',               pageId: 'employees'            },
      { label: 'Статьи расходов/доходов',  pageId: 'expense-income-items' },
      { label: 'Шаблоны операций',         pageId: 'operation-templates'  },
    ],
  },
  {
    id: 'operations',
    icon: <ClipboardList size={17} />,
    label: 'Операции',
    pageId: 'operations',
  },
  {
    id: 'salary',
    icon: <Wallet size={17} />,
    label: 'Зарплата',
    pageId: 'salary',
  },
  // {
  //   id: 'docs',
  //   icon: <FileText size={17} />,
  //   label: 'Документы',
  //   pageId: 'create-document',
  // },
  {
    id: 'journal',
    icon: <ScrollText size={17} />,
    label: 'Журнал операций',
    pageId: 'journal',
  },
  {
    id: 'reports',
    icon: <BarChart2 size={17} />,
    label: 'Отчёты',
    children: [
      { label: 'ОСВ',           pageId: 'osv'              },
      { label: 'Анализ счета',  pageId: 'account-analysis' },
      { label: 'Общая сводка',  pageId: 'general-summary'  },
    ],
  },
  {
    id: 'analytics',
    icon: <Activity size={17} />,
    label: 'Аналитика',
    pageId: 'analytics',
  },
  {
    id: 'ai-analytics',
    icon: <Sparkles size={17} />,
    label: 'AI Аналитика',
    pageId: 'ai-analytics',
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activePage: PageId
  onNavigate: (pageId: PageId) => void
}

export default function Sidebar({ collapsed, onToggle, activePage, onNavigate }: SidebarProps) {
  const getInitialOpen = () =>
    navGroups
      .filter((g) => g.children?.some((c) => c.pageId === activePage))
      .map((g) => g.id)

  const [openGroups, setOpenGroups] = useState<string[]>(() => getInitialOpen())

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  const isGroupActive = (group: NavGroup) => {
    if (group.pageId === activePage) return true
    return group.children?.some((c) => c.pageId === activePage) ?? false
  }

  return (
    <aside
      className={`
        flex flex-col bg-white border-r border-gray-200 h-full
        transition-all duration-200 ease-in-out shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* ── brand header ──────────────────────────────────────────────── */}
      <div className="flex items-center h-14 px-4 border-b border-gray-200 shrink-0">
        {!collapsed && (
          <span className="font-semibold text-gray-800 text-sm tracking-wide truncate mr-auto">
            Бухгалтерия
          </span>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors ${collapsed ? 'mx-auto' : 'ml-auto'}`}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* ── nav ───────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'px-2'}`}>
          {navGroups.map((group) => {
            const isOpen = openGroups.includes(group.id)
            const hasChildren = !!group.children?.length
            const active = isGroupActive(group)

            return (
              <div key={group.id} className="flex flex-col">
                <SidebarItem
                  icon={group.icon}
                  label={group.label}
                  active={!hasChildren && active}
                  collapsed={collapsed}
                  hasChildren={hasChildren}
                  isOpen={isOpen}
                  onClick={() => {
                    if (hasChildren) {
                      if (!collapsed) toggleGroup(group.id)
                    } else if (group.pageId) {
                      onNavigate(group.pageId)
                    }
                  }}
                />

                {/* submenu */}
                {hasChildren && isOpen && !collapsed && (
                  <div className="ml-8 mr-1 mt-0.5 mb-1 flex flex-col gap-0.5">
                    {group.children!.map((child) => (
                      <button
                        key={child.pageId}
                        onClick={() => onNavigate(child.pageId)}
                        className={`
                          w-full text-left text-xs px-3 py-1.5 rounded-md
                          transition-colors
                          ${child.pageId === activePage
                            ? 'text-blue-600 font-medium bg-blue-50'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                          }
                        `}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── bottom ────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 py-2 shrink-0">
        <div className={collapsed ? '' : 'px-2'}>
          <SidebarItem
            icon={<Settings size={17} />}
            label="Настройки"
            active={activePage === 'settings'}
            collapsed={collapsed}
            onClick={() => onNavigate('settings')}
          />
        </div>
      </div>
    </aside>
  )
}
