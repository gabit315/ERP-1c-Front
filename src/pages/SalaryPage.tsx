import { useState } from 'react'
import SalaryListPage from './SalaryListPage'
import SalaryDetailPage from './SalaryDetailPage'

/**
 * Entry point for the Salary module.
 * Manages internal navigation between list and employee detail views.
 */
export default function SalaryPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)

  if (selectedEmployeeId !== null) {
    return (
      <SalaryDetailPage
        employeeId={selectedEmployeeId}
        onBack={() => setSelectedEmployeeId(null)}
      />
    )
  }

  return <SalaryListPage onSelectEmployee={setSelectedEmployeeId} />
}
