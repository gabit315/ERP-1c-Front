interface PageHeaderWithActionProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeaderWithAction({ title, subtitle, action }: PageHeaderWithActionProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
