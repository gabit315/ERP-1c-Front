// ─── domain types ─────────────────────────────────────────────────────────────
// These mirror the expected GET /api/analytics/ai response shape.
// When backend is ready, replace getAIAnalyticsData() body with apiFetch call.

export interface ForecastPoint {
  label:    string
  actual:   number | null   // ₸ thousands — null means future period
  forecast: number | null   // ₸ thousands — null means not needed
}

export interface TrendPoint {
  label:   string
  income:  number  // ₸ thousands
  expense: number
  balance: number
}

export type AnomalySeverity = 'danger' | 'warning' | 'info'

export interface Anomaly {
  id:          string
  title:       string
  description: string
  date:        string
  amount:      string
  severity:    AnomalySeverity
}

export interface KPIForecast {
  balance: { value: string; note: string; noteUp: boolean; subtitle: string }
  income:  { value: string; accuracy: string; subtitle: string }
  expense: { value: string; note: string; noteUp: boolean; subtitle: string }
}

export interface ChartConfig {
  minY:     number
  maxY:     number
  tickStep: number
  hint:     string
  color:    string   // hex for actual line/area
}

export interface AIAnalyticsData {
  kpi:             KPIForecast
  expenseForecast: ForecastPoint[]
  incomeForecast:  ForecastPoint[]
  expenseConfig:   ChartConfig
  incomeConfig:    ChartConfig
  trends:          TrendPoint[]
  anomalies:       Anomaly[]
  insight:         string
}

// ─── period ───────────────────────────────────────────────────────────────────

export const AI_PERIODS = ['3 месяца', '6 месяцев', '12 месяцев'] as const
export type AIPeriod = (typeof AI_PERIODS)[number]

// ─── mock datasets ────────────────────────────────────────────────────────────

const DATA_3M: AIAnalyticsData = {
  kpi: {
    balance: { value: '330 000 ₸',   note: '↑ +10% к прошлому кварталу', noteUp: true,  subtitle: 'Ожидаемый баланс на конец квартала' },
    income:  { value: '1 150 000 ₸', accuracy: '88%',                                   subtitle: 'Прогноз доходов на апрель' },
    expense: { value: '820 000 ₸',   note: '↑ +5% к среднему',           noteUp: false, subtitle: 'Прогноз расходов на апрель' },
  },
  expenseForecast: [
    { label: 'Январь',  actual: 750,  forecast: null },
    { label: 'Февраль', actual: 780,  forecast: null },
    { label: 'Март',    actual: 820,  forecast: 820  },
    { label: 'Апрель',  actual: null, forecast: 850  },
  ],
  incomeForecast: [
    { label: 'Январь',  actual: 1050, forecast: null },
    { label: 'Февраль', actual: 1100, forecast: null },
    { label: 'Март',    actual: 1150, forecast: 1150 },
    { label: 'Апрель',  actual: null, forecast: 1210 },
  ],
  expenseConfig: { minY: 700, maxY: 900,  tickStep: 50,  hint: 'Умеренный рост расходов за квартал',   color: '#3b82f6' },
  incomeConfig:  { minY: 1000, maxY: 1250, tickStep: 100, hint: 'Стабильный рост поступлений',          color: '#22c55e' },
  trends: [
    { label: 'Янв', income: 1050, expense: 750, balance: 300 },
    { label: 'Фев', income: 1100, expense: 780, balance: 320 },
    { label: 'Мар', income: 1150, expense: 820, balance: 330 },
    { label: 'Апр', income: 1210, expense: 850, balance: 360 },
  ],
  anomalies: [
    { id: 'a1', severity: 'danger',  title: 'Резкий рост коммунальных расходов', description: 'На 35% выше среднего за квартал',        date: '15 марта 2026',   amount: '+127 000 ₸' },
    { id: 'a2', severity: 'warning', title: 'Снижение поступлений от родителей', description: 'Снижение на 12% в феврале',              date: '28 февраля 2026', amount: '−164 000 ₸' },
  ],
  insight: 'За последние 3 месяца наблюдается стабильный рост доходов (+9,5% в среднем) при умеренном увеличении расходов. Ключевой риск — рост коммунальных платежей в марте.',
}

const DATA_6M: AIAnalyticsData = {
  kpi: {
    balance: { value: '410 000 ₸',   note: '↑ +15% к прошлому месяцу', noteUp: true,  subtitle: 'Ожидаемый баланс на конец месяца' },
    income:  { value: '1 320 000 ₸', accuracy: '92%',                                  subtitle: 'Прогноз доходов на следующий месяц' },
    expense: { value: '910 000 ₸',   note: '↓ −3% к среднему',         noteUp: false, subtitle: 'Прогноз расходов на следующий месяц' },
  },
  expenseForecast: [
    { label: 'Январь',  actual: 750,  forecast: null },
    { label: 'Февраль', actual: 780,  forecast: null },
    { label: 'Март',    actual: 820,  forecast: 820  },
    { label: 'Апрель',  actual: null, forecast: 850  },
    { label: 'Май',     actual: null, forecast: 882  },
    { label: 'Июнь',    actual: null, forecast: 910  },
  ],
  incomeForecast: [
    { label: 'Январь',  actual: 1050, forecast: null },
    { label: 'Февраль', actual: 1100, forecast: null },
    { label: 'Март',    actual: 1150, forecast: 1150 },
    { label: 'Апрель',  actual: null, forecast: 1210 },
    { label: 'Май',     actual: null, forecast: 1265 },
    { label: 'Июнь',    actual: null, forecast: 1320 },
  ],
  expenseConfig: { minY: 700, maxY: 950,  tickStep: 50,  hint: 'Рост связан с сезонностью и коммунальными платежами',  color: '#3b82f6' },
  incomeConfig:  { minY: 1000, maxY: 1350, tickStep: 100, hint: 'Ожидается рост за счет увеличения числа учащихся',    color: '#22c55e' },
  trends: [
    { label: 'Янв', income: 1050, expense: 750, balance: 300 },
    { label: 'Фев', income: 1100, expense: 780, balance: 320 },
    { label: 'Мар', income: 1150, expense: 820, balance: 330 },
    { label: 'Апр', income: 1210, expense: 850, balance: 360 },
    { label: 'Май', income: 1265, expense: 882, balance: 383 },
    { label: 'Июн', income: 1320, expense: 910, balance: 410 },
  ],
  anomalies: [
    { id: 'a1', severity: 'danger',  title: 'Резкий рост коммунальных расходов', description: 'На 35% выше среднего за последние 3 месяца',              date: '15 марта 2026',  amount: '+127 000 ₸' },
    { id: 'a2', severity: 'warning', title: 'Снижение поступлений от родителей', description: 'Снижение на 12% по сравнению с предыдущим месяцем',        date: '10 марта 2026',  amount: '−164 000 ₸' },
    { id: 'a3', severity: 'info',    title: 'Необычная операция',                description: 'Крупная оплата поставщику без предварительного договора',  date: '12 марта 2026',  amount: '450 000 ₸'  },
  ],
  insight: 'Рекомендуем проверить коммунальные расходы и создать резерв на следующий месяц. Прогнозируемый рост доходов в апреле–июне подтверждается ростом числа учащихся на 8%.',
}

const DATA_12M: AIAnalyticsData = {
  kpi: {
    balance: { value: '1 250 000 ₸',  note: '↑ +22% к прошлому году', noteUp: true,  subtitle: 'Ожидаемый баланс на конец года' },
    income:  { value: '14 400 000 ₸', accuracy: '85%',                               subtitle: 'Прогноз доходов за год' },
    expense: { value: '10 200 000 ₸', note: '↑ +18% к прошлому году', noteUp: false, subtitle: 'Прогноз расходов за год' },
  },
  expenseForecast: [
    { label: 'Янв', actual: 680,  forecast: null },
    { label: 'Фев', actual: 720,  forecast: null },
    { label: 'Мар', actual: 750,  forecast: null },
    { label: 'Апр', actual: 780,  forecast: null },
    { label: 'Май', actual: 800,  forecast: null },
    { label: 'Июн', actual: 820,  forecast: null },
    { label: 'Июл', actual: 790,  forecast: null },
    { label: 'Авг', actual: 810,  forecast: null },
    { label: 'Сен', actual: 850,  forecast: 850  },
    { label: 'Окт', actual: null, forecast: 880  },
    { label: 'Ноя', actual: null, forecast: 900  },
    { label: 'Дек', actual: null, forecast: 920  },
  ],
  incomeForecast: [
    { label: 'Янв', actual: 980,  forecast: null },
    { label: 'Фев', actual: 1020, forecast: null },
    { label: 'Мар', actual: 1050, forecast: null },
    { label: 'Апр', actual: 1100, forecast: null },
    { label: 'Май', actual: 1150, forecast: null },
    { label: 'Июн', actual: 1180, forecast: null },
    { label: 'Июл', actual: 1100, forecast: null },
    { label: 'Авг', actual: 1130, forecast: null },
    { label: 'Сен', actual: 1200, forecast: 1200 },
    { label: 'Окт', actual: null, forecast: 1250 },
    { label: 'Ноя', actual: null, forecast: 1300 },
    { label: 'Дек', actual: null, forecast: 1320 },
  ],
  expenseConfig: { minY: 600, maxY: 1000, tickStep: 100, hint: 'Годовая тенденция роста расходов (+18%)',         color: '#3b82f6' },
  incomeConfig:  { minY: 900, maxY: 1400, tickStep: 100, hint: 'Устойчивый рост доходов — прогноз подтверждён',  color: '#22c55e' },
  trends: [
    { label: 'Янв', income: 980,  expense: 680, balance: 300 },
    { label: 'Фев', income: 1020, expense: 720, balance: 300 },
    { label: 'Мар', income: 1050, expense: 750, balance: 300 },
    { label: 'Апр', income: 1100, expense: 780, balance: 320 },
    { label: 'Май', income: 1150, expense: 800, balance: 350 },
    { label: 'Июн', income: 1180, expense: 820, balance: 360 },
    { label: 'Июл', income: 1100, expense: 790, balance: 310 },
    { label: 'Авг', income: 1130, expense: 810, balance: 320 },
    { label: 'Сен', income: 1200, expense: 850, balance: 350 },
    { label: 'Окт', income: 1250, expense: 880, balance: 370 },
    { label: 'Ноя', income: 1300, expense: 900, balance: 400 },
    { label: 'Дек', income: 1320, expense: 920, balance: 400 },
  ],
  anomalies: [
    { id: 'a1', severity: 'danger',  title: 'Резкий рост коммунальных расходов', description: 'На 35% выше среднего за последние 3 месяца',             date: '15 марта 2026',  amount: '+127 000 ₸' },
    { id: 'a2', severity: 'warning', title: 'Снижение поступлений от родителей', description: 'Снижение на 12% по сравнению с предыдущим месяцем',       date: '10 марта 2026',  amount: '−164 000 ₸' },
    { id: 'a3', severity: 'info',    title: 'Необычная операция',                description: 'Крупная оплата поставщику без предварительного договора', date: '12 марта 2026',  amount: '450 000 ₸'  },
    { id: 'a4', severity: 'warning', title: 'Сезонный спад в июле',             description: 'Снижение доходов на 7% — ожидаемый летний паттерн',      date: 'Июль 2025',      amount: '−80 000 ₸'  },
  ],
  insight: 'Годовой тренд — устойчивый рост (+22%). Рекомендуем усилить контроль за коммунальными расходами в зимний период. Прогноз на Q4: положительный баланс 1,2+ млн ₸ при условии сохранения темпов набора учащихся.',
}

const DATASETS: Record<AIPeriod, AIAnalyticsData> = {
  '3 месяца':  DATA_3M,
  '6 месяцев': DATA_6M,
  '12 месяцев': DATA_12M,
}

// ─── public service ────────────────────────────────────────────────────────────

/**
 * Returns AI analytics data for the given period.
 *
 * Currently returns mock data.
 * TODO: swap body to real API call when backend /api/analytics/ai is ready:
 *   return apiFetch<AIAnalyticsData>(`/api/analytics/ai?period=${encodeURIComponent(period)}`)
 */
export function getAIAnalyticsData(period: AIPeriod): Promise<AIAnalyticsData> {
  return Promise.resolve(DATASETS[period])
}
