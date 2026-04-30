import { useState } from 'react'
import SalaryListPage from './SalaryListPage'
import SalaryDetailPage from './SalaryDetailPage'

/**
 * Entry point for the Salary module.
 * Manages internal navigation between list and employee detail views.
 */
export default function SalaryPage() {
  const [selected, setSelected] = useState<{ employeeId: number; period: string } | null>(null)

  if (selected !== null) {
    return (
      <SalaryDetailPage
        employeeId={selected.employeeId}
        period={selected.period}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <SalaryListPage
      onSelectEmployee={(id, period) => setSelected({ employeeId: id, period })}
    />
  )
}
