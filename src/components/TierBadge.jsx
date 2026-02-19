export default function TierBadge({ tier, size = 'md' }) {
  if (!tier) return null

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5 font-bold',
    lg: 'text-base px-3 py-1 font-bold',
  }

  return (
    <span className={`${tier.color} ${sizes[size]} rounded font-mono`}>
      {tier.name}
    </span>
  )
}
