type BadgeVariant = 'active' | 'passive' | 'active-passive' | 'neutral' | 'supplier' | 'buyer'

interface StatusBadgeProps {
  label: string
  variant: BadgeVariant
}

const styles: Record<BadgeVariant, string> = {
  active:          'bg-green-50  text-green-700',
  passive:         'bg-blue-50   text-blue-700',
  'active-passive': 'bg-amber-50  text-amber-700',
  neutral:         'bg-gray-100  text-gray-600',
  supplier:        'bg-orange-50 text-orange-700',
  buyer:           'bg-green-50  text-green-700',
}

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[variant]}`}>
      {label}
    </span>
  )
}
