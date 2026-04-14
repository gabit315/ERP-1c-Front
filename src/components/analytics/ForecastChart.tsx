import { Info } from 'lucide-react'
import type { ForecastPoint, ChartConfig } from '../../services/aiAnalytics'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtAxis(v: number): string {
  if (v === 0) return '0'
  if (v >= 1000) {
    const m = v / 1000
    return m === Math.floor(m) ? `${m}М` : `${m.toFixed(1)}М`
  }
  return `${v}К`
}

// ─── Legend ───────────────────────────────────────────────────────────────────

interface LegendItem { color: string; dash?: boolean; label: string }

function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex items-center gap-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          {it.dash ? (
            <svg width={18} height={6}>
              <line x1={0} y1={3} x2={18} y2={3}
                stroke={it.color} strokeWidth={2} strokeDasharray="4,3" />
            </svg>
          ) : (
            <div className="w-3.5 h-1 rounded-full" style={{ background: it.color }} />
          )}
          <span className="text-xs text-gray-500">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── SVG area chart ───────────────────────────────────────────────────────────

const FORECAST_COLOR = '#8b5cf6'

function AreaChart({
  data,
  config,
}: {
  data:   ForecastPoint[]
  config: ChartConfig
}) {
  const W = 440, H = 185
  const P = { t: 10, r: 12, b: 28, l: 44 }
  const cW = W - P.l - P.r
  const cH = H - P.t - P.b
  const n  = data.length

  if (n < 2) return null

  const xAt = (i: number) => P.l + (i / (n - 1)) * cW
  const yAt = (v: number) =>
    P.t + (1 - (v - config.minY) / (config.maxY - config.minY)) * cH
  const yBase = P.t + cH

  type Pt = { x: number; y: number }
  const actualPts:   Pt[] = []
  const forecastPts: Pt[] = []

  data.forEach((d, i) => {
    if (d.actual   !== null) actualPts.push(  { x: xAt(i), y: yAt(d.actual)   })
    if (d.forecast !== null) forecastPts.push({ x: xAt(i), y: yAt(d.forecast) })
  })

  const areaPath = (pts: Pt[]) =>
    pts.length < 2 ? '' : [
      `M ${pts[0].x.toFixed(1)} ${yBase.toFixed(1)}`,
      ...pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
      `L ${pts[pts.length - 1].x.toFixed(1)} ${yBase.toFixed(1)}`,
      'Z',
    ].join(' ')

  const linePath = (pts: Pt[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  const ticks: number[] = []
  for (let v = config.minY; v <= config.maxY + config.tickStep * 0.1; v += config.tickStep) {
    ticks.push(Math.round(v))
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* grid + y-axis labels */}
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={P.l} y1={yAt(v)} x2={W - P.r} y2={yAt(v)}
            stroke="#f3f4f6" strokeWidth={1}
          />
          <text
            x={P.l - 5} y={yAt(v)} fontSize={9}
            textAnchor="end" dominantBaseline="middle" fill="#9ca3af"
          >
            {fmtAxis(v)}
          </text>
        </g>
      ))}

      {/* fill areas */}
      <path d={areaPath(actualPts)}   fill={config.color}  fillOpacity={0.1} />
      <path d={areaPath(forecastPts)} fill={FORECAST_COLOR} fillOpacity={0.07} />

      {/* lines */}
      <path d={linePath(actualPts)}
        fill="none" stroke={config.color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <path d={linePath(forecastPts)}
        fill="none" stroke={FORECAST_COLOR} strokeWidth={2.5}
        strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />

      {/* dots — actual */}
      {actualPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3}
          fill={config.color} stroke="white" strokeWidth={1.5} />
      ))}
      {/* dots — forecast (skip shared transition point) */}
      {forecastPts.slice(1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3}
          fill={FORECAST_COLOR} stroke="white" strokeWidth={1.5} />
      ))}

      {/* x-axis labels */}
      {data.map((d, i) => (
        <text key={i} x={xAt(i)} y={H - 4} fontSize={10}
          textAnchor="middle" fill="#9ca3af">
          {d.label.substring(0, 3)}
        </text>
      ))}
    </svg>
  )
}

// ─── public component ─────────────────────────────────────────────────────────

interface ForecastChartProps {
  title:      string
  data:       ForecastPoint[]
  config:     ChartConfig
  actualLabel: string
}

export default function ForecastChart({
  title,
  data,
  config,
  actualLabel,
}: ForecastChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start gap-1.5 text-xs text-gray-400">
          <Info size={12} className="mt-0.5 shrink-0 text-gray-300" />
          <span>{config.hint}</span>
        </div>
        <AreaChart data={data} config={config} />
        <Legend items={[
          { color: config.color,  label: actualLabel },
          { color: FORECAST_COLOR, dash: true, label: 'Прогноз' },
        ]} />
      </div>
    </div>
  )
}
