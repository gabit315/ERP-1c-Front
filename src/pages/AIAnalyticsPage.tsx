import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

import { AI_PERIODS, getAIAnalyticsData, type AIPeriod, type AIAnalyticsData } from '../services/aiAnalytics'
import AnalyticsCard     from '../components/analytics/AnalyticsCard'
import ForecastChart     from '../components/analytics/ForecastChart'
import TrendsChart       from '../components/analytics/TrendsChart'
import AnomalyCard       from '../components/analytics/AnomalyCard'
import AIInsightCard     from '../components/analytics/AIInsightCard'
import MethodologyCard   from '../components/analytics/MethodologyCard'

// ─── loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded-lg ${className ?? ''}`} />
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="flex gap-4">
        <Skeleton className="flex-1 h-32" />
        <Skeleton className="flex-1 h-32" />
        <Skeleton className="flex-1 h-32" />
      </div>
      {/* charts row */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      {/* trends */}
      <Skeleton className="h-56" />
      {/* anomalies */}
      <Skeleton className="h-64" />
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

const SELECT_CLS =
  'px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 ' +
  'focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition-colors'

export default function AIAnalyticsPage() {
  const [period, setPeriod]   = useState<AIPeriod>('6 месяцев')
  const [data,   setData]     = useState<AIAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAIAnalyticsData(period)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-screen-xl mx-auto flex flex-col gap-6">

        {/* ── header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
            >
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                AI Аналитика и Прогнозирование
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Умные прогнозы и анализ данных с помощью искусственного интеллекта
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <label className="text-xs font-medium text-gray-500">Период</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as AIPeriod)}
              className={SELECT_CLS}
            >
              {AI_PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── error banner ────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── loading ─────────────────────────────────────────────────── */}
        {loading && <PageSkeleton />}

        {/* ── content ─────────────────────────────────────────────────── */}
        {!loading && data && (
          <>
            {/* methodology */}
            <MethodologyCard />

            {/* KPI cards */}
            <div className="flex gap-4">
              <AnalyticsCard variant="balance" kpi={data.kpi} />
              <AnalyticsCard variant="income"  kpi={data.kpi} />
              <AnalyticsCard variant="expense" kpi={data.kpi} />
            </div>

            {/* forecast charts */}
            <div className="grid grid-cols-2 gap-4">
              <ForecastChart
                title="Прогноз расходов"
                data={data.expenseForecast}
                config={data.expenseConfig}
                actualLabel="Фактические"
              />
              <ForecastChart
                title="Прогноз доходов"
                data={data.incomeForecast}
                config={data.incomeConfig}
                actualLabel="Фактические"
              />
            </div>

            {/* monthly trends bar chart */}
            <TrendsChart data={data.trends} />

            {/* anomalies + insight */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Обнаруженные аномалии</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  AI выявил необычные паттерны в ваших данных
                </p>
              </div>

              {data.anomalies.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Аномалий за выбранный период не обнаружено
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.anomalies.map((a) => (
                    <AnomalyCard key={a.id} anomaly={a} />
                  ))}
                </div>
              )}

              <AIInsightCard text={data.insight} />
            </div>
          </>
        )}

      </div>
    </div>
  )
}
