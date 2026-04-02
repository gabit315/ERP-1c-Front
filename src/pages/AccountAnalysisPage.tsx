import { useState, useEffect, useCallback } from 'react'
import { Download } from 'lucide-react'
import PageHeaderWithAction from '../components/ui/PageHeaderWithAction'
import { getAccounts, getAccountAnalysis, type Account, type AccountAnalysis } from '../api/accounts'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(v: number): string {
  return v.toLocaleString('ru-RU') + ' ₸'
}

function fmtNum(v: number | null): string {
  if (v === null) return '—'
  return v.toLocaleString('ru-RU')
}

function exportToCsv(analysis: AccountAnalysis, dateFrom: string, dateTo: string) {
  const header = ['Дата', 'Операция', 'Описание', 'Дебет', 'Кредит', 'Остаток']
  const rows = analysis.movements.map((m) => [
    m.date,
    m.operationNumber,
    m.description,
    m.debit !== null ? String(m.debit) : '',
    m.credit !== null ? String(m.credit) : '',
    String(m.balanceAmount),
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `account_${analysis.account.code}_${dateFrom}_${dateTo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── shared classes ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

// ─── sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  valueClass = 'text-gray-800',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-xl font-semibold mt-2 leading-none ${valueClass}`}>{value}</p>
    </div>
  )
}

function MovementsTable({
  movements,
  loading,
  error,
  onRetry,
}: {
  movements: AccountAnalysis['movements'] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
        <span className="text-sm text-gray-400">Загрузка анализа...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-sm text-red-500">{error}</span>
        <button
          onClick={onRetry}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Повторить
        </button>
      </div>
    )
  }

  if (!movements || movements.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-16">
        <span className="text-sm text-gray-400">Нет движений за выбранный период</span>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-32">
              Дата
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-32">
              Операция
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3">
              Описание
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Дебет
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Кредит
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-44">
              Остаток
            </th>
          </tr>
        </thead>
        <tbody>
          {movements.map((row) => (
            <tr
              key={row.entryId}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="px-5 py-3.5 text-gray-500 tabular-nums">
                {row.date}
              </td>
              <td className="px-4 py-3.5">
                <span className="text-sm font-medium text-blue-600">
                  {row.operationNumber || '—'}
                </span>
              </td>
              <td className="px-4 py-3.5 text-gray-700">
                {row.description || '—'}
              </td>
              <td className="px-4 py-3.5 text-right tabular-nums">
                {row.debit !== null ? (
                  <span className="font-medium text-green-600">{fmtNum(row.debit)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right tabular-nums">
                {row.credit !== null ? (
                  <span className="font-medium text-red-500">{fmtNum(row.credit)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums font-medium text-gray-700">
                {fmtMoney(row.balanceAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AccountAnalysisPage() {
  const [dateFrom, setDateFrom] = useState('2026-03-01')
  const [dateTo, setDateTo]     = useState('2026-03-31')

  // accounts list (for select)
  const [accounts, setAccounts]         = useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountsError, setAccountsError]     = useState<string | null>(null)
  const [selectedCode, setSelectedCode] = useState<string>('')

  // analysis data
  const [analysis, setAnalysis]       = useState<AccountAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError]     = useState<string | null>(null)

  // ─── load accounts list ──────────────────────────────────────────────────

  const loadAccounts = () => {
    setAccountsLoading(true)
    setAccountsError(null)
    getAccounts()
      .then((list) => {
        setAccounts(list)
        if (list.length > 0) setSelectedCode(list[0].code)
      })
      .catch((e: unknown) => {
        setAccountsError(e instanceof Error ? e.message : 'Ошибка загрузки счетов')
      })
      .finally(() => setAccountsLoading(false))
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  // ─── load analysis ───────────────────────────────────────────────────────

  const loadAnalysis = useCallback((code: string, from: string, to: string) => {
    if (!code || !from || !to) return
    setAnalysisLoading(true)
    setAnalysisError(null)
    getAccountAnalysis(code, from, to)
      .then(setAnalysis)
      .catch((e: unknown) => {
        setAnalysisError(e instanceof Error ? e.message : 'Ошибка загрузки анализа счета')
        setAnalysis(null)
      })
      .finally(() => setAnalysisLoading(false))
  }, [])

  // reload when account or dates change
  useEffect(() => {
    if (selectedCode) loadAnalysis(selectedCode, dateFrom, dateTo)
  }, [selectedCode, dateFrom, dateTo, loadAnalysis])

  // ─── summary values ──────────────────────────────────────────────────────

  const summary = analysis?.summary ?? null
  const openingValue  = summary ? fmtMoney(summary.openingBalanceAmount) : '—'
  const closingValue  = summary ? fmtMoney(summary.closingBalanceAmount) : '—'

  // net turnover: debit - credit; show sign
  let turnoverValue = '—'
  let turnoverClass = 'text-gray-800'
  if (summary) {
    const net = (summary.turnoverDebit ?? 0) - (summary.turnoverCredit ?? 0)
    if (net > 0) {
      turnoverValue = '+' + fmtMoney(net)
      turnoverClass = 'text-green-600'
    } else if (net < 0) {
      turnoverValue = '−' + fmtMoney(Math.abs(net))
      turnoverClass = 'text-red-500'
    } else {
      turnoverValue = fmtMoney(0)
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────────── */}
        <PageHeaderWithAction
          title="Анализ счета"
          subtitle="Подробная история движений по выбранному счету"
          action={
            <button
              type="button"
              disabled={!analysis || analysisLoading}
              onClick={() => analysis && exportToCsv(analysis, dateFrom, dateTo)}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={15} />
              Экспорт
            </button>
          }
        />

        {/* Accounts load error */}
        {accountsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-600">{accountsError}</span>
            <button
              onClick={loadAccounts}
              className="text-sm font-medium text-red-600 hover:text-red-700 underline ml-4 shrink-0"
            >
              Повторить
            </button>
          </div>
        )}

        {/* ── filter card ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-5">
          <div className="flex gap-4">

            <div className="flex-[2] flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Счет</label>
              {accountsLoading ? (
                <div className={inputCls + ' text-gray-400'}>Загрузка счетов...</div>
              ) : (
                <select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className={inputCls}
                >
                  {accounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Дата начала</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Дата окончания</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputCls}
              />
            </div>

          </div>
        </div>

        {/* ── summary stat cards ──────────────────────────────────────── */}
        <div className="flex gap-4">
          <SummaryCard
            label="Начальный остаток"
            value={openingValue}
          />
          <SummaryCard
            label="Обороты за период"
            value={turnoverValue}
            valueClass={turnoverClass}
          />
          <SummaryCard
            label="Конечный остаток"
            value={closingValue}
          />
        </div>

        {/* ── movements table ─────────────────────────────────────────── */}
        <MovementsTable
          movements={analysis?.movements ?? null}
          loading={analysisLoading}
          error={analysisError}
          onRetry={() => loadAnalysis(selectedCode, dateFrom, dateTo)}
        />

      </div>
    </div>
  )
}
