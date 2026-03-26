interface SectionCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg flex flex-col ${className}`}>
      <div className="px-5 py-3.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="flex-1 p-5">
        {children}
      </div>
    </div>
  )
}
