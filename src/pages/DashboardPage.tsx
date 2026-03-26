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
} from 'lucide-react'
import KPIStatCard from '../components/ui/KPIStatCard'
import SectionCard from '../components/ui/SectionCard'
import ActionButtonCard from '../components/ui/ActionButtonCard'
import RecentOperationList, { type Operation } from '../components/ui/RecentOperationList'

const kpiCards = [
  {
    title: 'Общий баланс',
    value: '12 450 000 ₽',
    subtitle: 'На все счета',
    icon: <DollarSign size={18} className="text-blue-600" />,
    iconBg: 'bg-blue-50',
    trend: 'up' as const,
    trendLabel: '+4,2% за последний месяц',
  },
  {
    title: 'Доходы за месяц',
    value: '3 250 000 ₽',
    subtitle: 'Март 2026',
    icon: <TrendingUp size={18} className="text-green-600" />,
    iconBg: 'bg-green-50',
    trend: 'up' as const,
    trendLabel: '+12,5% к прошлому месяцу',
  },
  {
    title: 'Расходы за месяц',
    value: '1 890 000 ₽',
    subtitle: 'Март 2026',
    icon: <TrendingDown size={18} className="text-red-500" />,
    iconBg: 'bg-red-50',
    trend: 'down' as const,
    trendLabel: '-3,1% к прошлому месяцу',
  },
  {
    title: 'Дебиторская задолженность',
    value: '540 000 ₽',
    subtitle: '8 контрагентов',
    icon: <AlertCircle size={18} className="text-amber-500" />,
    iconBg: 'bg-amber-50',
    trend: 'neutral' as const,
    trendLabel: 'Без изменений',
  },
]

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

const recentOperations: Operation[] = [
  {
    id: '1',
    date: '25.03.2026',
    description: 'Оплата за обучение — Иванов И.И.',
    amount: '45 000 ₽',
    type: 'income',
  },
  {
    id: '2',
    date: '25.03.2026',
    description: 'Закупка учебных материалов',
    amount: '12 300 ₽',
    type: 'expense',
  },
  {
    id: '3',
    date: '24.03.2026',
    description: 'Субсидия из бюджета',
    amount: '500 000 ₽',
    type: 'income',
  },
  {
    id: '4',
    date: '24.03.2026',
    description: 'Коммунальные услуги — март',
    amount: '38 750 ₽',
    type: 'expense',
  },
  {
    id: '5',
    date: '23.03.2026',
    description: 'Перевод на депозитный счёт',
    amount: '200 000 ₽',
    type: 'transfer',
  },
  {
    id: '6',
    date: '22.03.2026',
    description: 'Оплата за обучение — Петрова А.С.',
    amount: '45 000 ₽',
    type: 'income',
  },
  {
    id: '7',
    date: '21.03.2026',
    description: 'Ремонт оборудования',
    amount: '22 000 ₽',
    type: 'expense',
  },
]

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Главная панель</h1>
          <p className="text-sm text-gray-500 mt-1">
            Обзор финансовой деятельности учебного заведения
          </p>
        </div>

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
              <RecentOperationList operations={recentOperations} />
            </SectionCard>
          </div>
        </div>

      </div>
    </div>
  )
}
