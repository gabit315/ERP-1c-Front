import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, ChevronRight, X, RefreshCw, ServerCrash, Loader2, Inbox, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import { getAccounts, getAccountAnalysis } from '../api/accounts'
import type { Account, AccountAnalysis } from '../api/accounts'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸'
}

function sideLabel(side: string | null): string {
  if (side === 'debit') return 'Дт'
  if (side === 'credit') return 'Кт'
  return ''
}

// ─── account analysis modal ───────────────────────────────────────────────────

interface AnalysisModalProps {
  code: string
  name: string
  onClose: () => void
}

function AnalysisModal({ code, name, onClose }: AnalysisModalProps) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [data, setData] = useState<AccountAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const year = new Date().getFullYear()
      const dateFrom = `${year}-01-01`
      const dateTo   = `${year}-12-31`
      const result = await getAccountAnalysis(code, dateFrom, dateTo)
      setData(result)
      setStatus('success')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setStatus('error')
    }
  }, [code])

  useEffect(() => { void load() }, [load])

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-gray-500">{code}</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-semibold text-gray-800">{name}</span>
            </div>
            {data && (
              <p className="text-xs text-gray-400 mt-0.5">
                Период: {data.dateFrom} — {data.dateTo}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {status === 'loading' && (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Загрузка...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ServerCrash size={28} className="text-red-400" />
              <p className="text-sm text-gray-500">{errorMessage}</p>
              <button
                onClick={() => void load()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={12} />
                Повторить
              </button>
            </div>
          )}

          {status === 'success' && data && (
            <>
              {/* summary grid */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Обороты за период
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Нач. остаток', amount: data.summary.openingBalanceAmount, side: data.summary.openingBalanceSide },
                    { label: 'Оборот Дт',   amount: data.summary.turnoverDebit,         side: null },
                    { label: 'Оборот Кт',   amount: data.summary.turnoverCredit,        side: null },
                    { label: 'Кон. остаток', amount: data.summary.closingBalanceAmount,  side: data.summary.closingBalanceSide },
                  ].map(({ label, amount, side }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3.5">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 tabular-nums">{fmt(amount)}</p>
                      {side && (
                        <p className="text-xs text-gray-400 mt-0.5">{sideLabel(side)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* movements */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Движения по счёту
                </p>

                {data.movements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center border border-gray-200 rounded-lg">
                    <Inbox size={24} className="text-gray-300" />
                    <p className="text-sm text-gray-400">Нет движений за период</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-28">Дата</th>
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">Описание</th>
                          <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-32">Дебет</th>
                          <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-32">Кредит</th>
                          <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-36">Остаток</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.movements.map((m) => (
                          <tr key={m.entryId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{m.date}</td>
                            <td className="px-4 py-2.5 text-gray-700">
                              <p className="truncate max-w-xs">{m.description}</p>
                              {m.counterpartyName && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{m.counterpartyName}</p>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-green-700">
                              {m.debit != null ? fmt(m.debit) : ''}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-red-600">
                              {m.credit != null ? fmt(m.credit) : ''}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                              <span>{fmt(m.balanceAmount)}</span>
                              <span className="text-xs text-gray-400 ml-1">{sideLabel(m.balanceSide)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {Array.from({ length: 7 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 bg-gray-200 rounded w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              <td className="px-5 py-3.5"><div className="h-3.5 bg-gray-200 rounded w-12" /></td>
              <td className="px-4 py-3.5"><div className="h-3.5 bg-gray-200 rounded w-64" /></td>
              <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 rounded-full w-20" /></td>
              <td className="px-4 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-24 ml-auto" /></td>
              <td className="px-4 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-24 ml-auto" /></td>
              <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 rounded-full w-16" /></td>
              <td className="px-5 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── type badge helper ────────────────────────────────────────────────────────

function accountTypeBadge(type: Account['accountType']) {
  if (type === 'active')         return { label: 'Активный',    variant: 'active'          } as const
  if (type === 'passive')        return { label: 'Пассивный',   variant: 'passive'         } as const
  if (type === 'active-passive') return { label: 'Акт.-пасс.', variant: 'active-passive'  } as const
  return                                { label: type,           variant: 'neutral'         } as const
}

// ─── accounts table ───────────────────────────────────────────────────────────

interface AccountsTableProps {
  rows: Account[]
  onDetails: (account: Account) => void
}

function AccountsTable({ rows, onDetails }: AccountsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-32">
              Код счета
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3">
              Название
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-36">
              Тип
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-44">
              Нач. сальдо
            </th>
            <th className="text-right text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-44">
              Тек. остаток
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-4 py-3 w-32">
              Использование
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 tracking-wider uppercase px-5 py-3 w-32">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12">
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <Inbox size={24} className="text-gray-300" />
                  <p className="text-sm text-gray-400">Ничего не найдено</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((account) => {
              const badge = accountTypeBadge(account.accountType)
              return (
                <tr
                  key={account.code}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-sm font-medium text-gray-700">
                      {account.code}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-700">
                    {account.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge label={badge.label} variant={badge.variant} />
                  </td>
                  {/* Начальное сальдо — данных нет в текущем эндпоинте, точка расширения */}
                  <td className="px-4 py-3.5 text-right tabular-nums text-gray-400">
                    —
                  </td>
                  {/* Текущий остаток */}
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {account.balanceAmount != null ? (
                      <span className="font-medium text-gray-700">
                        {fmt(account.balanceAmount)}
                        {account.balanceSide && (
                          <span className="text-xs text-gray-400 ml-1.5">
                            {sideLabel(account.balanceSide)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {/* Использование */}
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      label={account.isActive ? 'Активен' : 'Неактивен'}
                      variant={account.isActive ? 'active' : 'neutral'}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => onDetails(account)}
                      className="flex items-center gap-0.5 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      Подробнее
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

type LoadStatus = 'loading' | 'error' | 'success'

export default function ChartOfAccountsPage() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')
  const [modalAccount, setModalAccount] = useState<Account | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await getAccounts()
      setAccounts(data)
      setStatus('success')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter(
      (a) => a.code.includes(q) || a.name.toLowerCase().includes(q)
    )
  }, [query, accounts])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        <PageHeader
          title="План счетов"
          subtitle="Предзагруженный план счетов Республики Казахстан"
        />

        {/* Account type reference */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={15} className="text-blue-500 shrink-0" />
            <p className="text-sm font-semibold text-blue-700">Справка по типам счетов</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                variant: 'active' as const,
                label: 'Активный',
                desc: 'Учёт имущества и расходов',
                range: '1000–5999, 7000–9999',
              },
              {
                variant: 'passive' as const,
                label: 'Пассивный',
                desc: 'Учёт обязательств, капитала и доходов',
                range: '2000–3999, 6000–6999',
              },
              {
                variant: 'active-passive' as const,
                label: 'Активно-пассивный',
                desc: 'Могут иметь дебетовое или кредитовое сальдо',
                range: null,
              },
            ].map(({ variant, label, desc, range }) => (
              <div key={label} className="flex items-start gap-2.5">
                <StatusBadge label={label} variant={variant} />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">{desc}</p>
                  {range && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{range}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search card */}
        <div className="bg-white border border-gray-200 rounded-lg px-6 py-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по коду или названию счета..."
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

        {/* table area */}
        {status === 'loading' && <TableSkeleton />}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <ServerCrash size={32} className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-700 font-medium">Не удалось загрузить план счетов</p>
              <p className="text-sm text-gray-400 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => void load()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={14} />
              Повторить
            </button>
          </div>
        )}

        {status === 'success' && (
          <AccountsTable rows={filtered} onDetails={setModalAccount} />
        )}

      </div>

      {/* analysis modal */}
      {modalAccount && (
        <AnalysisModal
          code={modalAccount.code}
          name={modalAccount.name}
          onClose={() => setModalAccount(null)}
        />
      )}
    </div>
  )
}
