import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FilePlus,
  CreditCard,
  FileBarChart,
  BookPlus,
  ReceiptText,
  ArrowDownToLine,
  RefreshCw,
  ServerCrash,
  Inbox,
} from 'lucide-react'
import KPIStatCard from '../components/ui/KPIStatCard'
import SectionCard from '../components/ui/SectionCard'
import ActionButtonCard from '../components/ui/ActionButtonCard'
import RecentOperationList, { type Operation } from '../components/ui/RecentOperationList'
import { checkHealth, getDashboard } from '../api/dashboard'
import type { DashboardData } from '../types/dashboard'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  // Already DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr
  // YYYY-MM-DD (possibly with time component) — parse without Date constructor
  // to avoid UTC-vs-local timezone shift
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (m) return `${m[3]}.${m[2]}.${m[1]}`
  return '—'
}

function trendDirection(percent: number | undefined): 'up' | 'down' | 'neutral' {
  if (percent == null) return 'neutral'
  if (percent > 0) return 'up'
  if (percent < 0) return 'down'
  return 'neutral'
}

function trendLabel(percent: number | undefined, suffix: string): string {
  if (percent == null) return 'Нет данных'
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(1)}%${suffix}`
}

function plural(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return ''
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а'
  return 'ов'
}

// ─── static quick actions ────────────────────────────────────────────────────

const quickActions = [
  {
    icon: <FilePlus size={18} />,
    label: 'Создать накладную',
    description: 'Приходная или расходная',
  },
  {
    icon: <CreditCard size={18} />,
    label: 'Добавить платёж',
    description: 'Платёжное поручение',
  },
  {
    icon: <FileBarChart size={18} />,
    label: 'Сформировать отчёт',
    description: 'Финансовая отчётность',
  },
  {
    icon: <BookPlus size={18} />,
    label: 'Новый контрагент',
    description: 'Добавить в справочник',
  },
  {
    icon: <ReceiptText size={18} />,
    label: 'Создать акт',
    description: 'Акт выполненных работ',
  },
  {
    icon: <ArrowDownToLine size={18} />,
    label: 'Импорт данных',
    description: 'Загрузить из файла',
  },
]

// ─── skeleton components ─────────────────────────────────────────────────────

function KPICardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3 flex-1 min-w-0 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0" />
      </div>
      <div>
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-100 rounded w-20 mt-1.5" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-36" />
    </div>
  )
}

function OperationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 animate-pulse">
      <div className="flex-1 min-w-0">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-16 mt-1" />
      </div>
      <div className="h-5 bg-gray-100 rounded w-12 shrink-0" />
      <div className="h-4 bg-gray-100 rounded w-24 shrink-0" />
    </div>
  )
}

// ─── page layout shell (used in all states) ──────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Главная панель</h1>
          <p className="text-sm text-gray-500 mt-1">
            Обзор финансовой деятельности учебного заведения
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

type LoadStatus = 'loading' | 'error' | 'success'

export default function DashboardPage() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [data, setData] = useState<DashboardData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      await checkHealth()
      const dashboard = await getDashboard()
      setData(dashboard)
      setStatus('success')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Неизвестная ошибка')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // ── loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <PageShell>
        <div className="flex gap-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <SectionCard title="Быстрые действия" className="h-full">
              <div className="flex flex-col gap-2">
                {quickActions.map((action) => (
                  <ActionButtonCard key={action.label} {...action} />
                ))}
              </div>
            </SectionCard>
          </div>
          <div className="col-span-3">
            <SectionCard title="Последние операции" className="h-full">
              <div className="flex flex-col divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <OperationRowSkeleton key={i} />
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </PageShell>
    )
  }

  // ── error ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="p-4 bg-red-50 rounded-full">
            <ServerCrash size={32} className="text-red-400" />
          </div>
          <div>
            <p className="text-gray-700 font-medium">
              Не удалось подключиться к серверу
            </p>
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
      </PageShell>
    )
  }

  // ── success ────────────────────────────────────────────────────────────────
  const d = data!

  const operations: Operation[] = (d.recent_operations ?? []).map((op) => ({
    id: String(op.id),
    date: formatDate(op.date),
    description: op.description,
    amount: formatAmount(op.amount),
    type: op.type,
  }))

  const kpiCards = [
    {
      title: 'Общий баланс',
      value: formatAmount(d.total_balance),
      subtitle: 'На все счета',
      icon: <DollarSign size={18} className="text-blue-600" />,
      iconBg: 'bg-blue-50',
      trend: trendDirection(d.balance_trend_percent),
      trendLabel: trendLabel(d.balance_trend_percent, ' за последний месяц'),
    },
    {
      title: 'Доходы за месяц',
      value: formatAmount(d.monthly_income),
      subtitle: new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' }),
      icon: <TrendingUp size={18} className="text-green-600" />,
      iconBg: 'bg-green-50',
      trend: trendDirection(d.income_trend_percent),
      trendLabel: trendLabel(d.income_trend_percent, ' к прошлому месяцу'),
    },
    {
      title: 'Расходы за месяц',
      value: formatAmount(d.monthly_expenses),
      subtitle: new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' }),
      icon: <TrendingDown size={18} className="text-red-500" />,
      iconBg: 'bg-red-50',
      trend: trendDirection(d.expenses_trend_percent),
      trendLabel: trendLabel(d.expenses_trend_percent, ' к прошлому месяцу'),
    },
    {
      title: 'Дебиторская задолженность',
      value: formatAmount(d.accounts_receivable),
      subtitle:
        d.receivables_count != null
          ? `${d.receivables_count} контрагент${plural(d.receivables_count)}`
          : undefined,
      icon: <AlertCircle size={18} className="text-amber-500" />,
      iconBg: 'bg-amber-50',
      trend: 'neutral' as const,
      trendLabel: 'Без изменений',
    },
  ]

  return (
    <PageShell>
      {/* KPI row */}
      <div className="flex gap-4">
        {kpiCards.map((card) => (
          <KPIStatCard key={card.title} {...card} />
        ))}
      </div>

      {/* Lower two-column section */}
      <div className="grid grid-cols-5 gap-4">
        {/* Quick actions — 2/5 */}
        <div className="col-span-2">
          <SectionCard title="Быстрые действия" className="h-full">
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <ActionButtonCard key={action.label} {...action} />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Recent operations — 3/5 */}
        <div className="col-span-3">
          <SectionCard title="Последние операции" className="h-full">
            {operations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Inbox size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400">Операций пока нет</p>
              </div>
            ) : (
              <RecentOperationList operations={operations} />
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
