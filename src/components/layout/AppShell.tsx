import { useState } from 'react'
import Sidebar, { type PageId } from './Sidebar'

interface AppShellProps {
  activePage: PageId
  onNavigate: (pageId: PageId) => void
  children: React.ReactNode
}

export default function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        activePage={activePage}
        onNavigate={onNavigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
