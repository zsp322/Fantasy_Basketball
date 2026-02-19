import { useState } from 'react'

export default function PlayerAvatar({ player, size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  const initials = `${player.first_name?.[0] ?? ''}${player.last_name?.[0] ?? ''}`

  const sizes = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-24 h-24 text-lg',
  }

  if (!player.headshot || imgError) {
    return (
      <div className={`${sizes[size]} rounded-full bg-gray-700 flex items-center justify-center font-bold text-white shrink-0`}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={player.headshot}
      alt={`${player.first_name} ${player.last_name}`}
      className={`${sizes[size]} rounded-full object-cover object-top bg-gray-800 shrink-0`}
      onError={() => setImgError(true)}
    />
  )
}
