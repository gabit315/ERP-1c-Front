import { useState } from 'react'
import AppShell from './components/layout/AppShell'
import { type PageId } from './components/layout/Sidebar'
import DashboardPage from './pages/DashboardPage'
import ChartOfAccountsPage from './pages/ChartOfAccountsPage'
import CounterpartiesPage from './pages/CounterpartiesPage'
import EmployeesPage from './pages/EmployeesPage'
import ExpenseIncomeItemsPage from './pages/ExpenseIncomeItemsPage'
import CreateOperationPage from './pages/CreateOperationPage'
import OperationsPage from './pages/OperationsPage'
import CreateDocumentPage from './pages/CreateDocumentPage'
import OperationsJournalPage from './pages/OperationsJournalPage'
import OsvReportPage from './pages/OsvReportPage'
import AccountAnalysisPage from './pages/AccountAnalysisPage'
import GeneralSummaryPage from './pages/GeneralSummaryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import OperationTemplatesPage from './pages/OperationTemplatesPage'
import AIAnalyticsPage from './pages/AIAnalyticsPage'

function renderPage(page: PageId, onNavigate: (p: PageId) => void) {
  switch (page) {
    case 'chart-of-accounts':    return <ChartOfAccountsPage />
    case 'counterparties':       return <CounterpartiesPage />
    case 'employees':            return <EmployeesPage />
    case 'expense-income-items':  return <ExpenseIncomeItemsPage />
    case 'operation-templates':  return <OperationTemplatesPage />
    case 'operations':           return <OperationsPage />
    case 'create-document':      return <CreateDocumentPage />
    case 'journal':              return <OperationsJournalPage />
    case 'osv':                  return <OsvReportPage />
    case 'account-analysis':     return <AccountAnalysisPage />
    case 'general-summary':      return <GeneralSummaryPage />
    case 'analytics':            return <AnalyticsPage />
    case 'ai-analytics':         return <AIAnalyticsPage />
    default:                     return <DashboardPage onNavigate={onNavigate} />
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')

  return (
    <AppShell activePage={currentPage} onNavigate={setCurrentPage}>
      {renderPage(currentPage, setCurrentPage)}
    </AppShell>
  )
}
