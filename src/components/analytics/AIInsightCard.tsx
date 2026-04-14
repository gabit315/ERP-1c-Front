import { Sparkles } from 'lucide-react'

interface AIInsightCardProps {
  text: string
}

export default function AIInsightCard({ text }: AIInsightCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
      <div
        className="p-2 rounded-lg shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
      >
        <Sparkles size={13} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-blue-800 mb-0.5">AI Совет</p>
        <p className="text-xs text-blue-700 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
