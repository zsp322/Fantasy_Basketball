import { useState } from 'react'

// Glow color by tier group
function getTierGlow(tierName) {
  if (!tierName) return 'rgba(156,163,175,0.6)'
  if (['S+', 'S', 'S-'].includes(tierName))  return 'rgba(250,204,21,0.8)'
  if (['A+', 'A', 'A-'].includes(tierName))  return 'rgba(74,222,128,0.7)'
  if (['B+', 'B', 'B-'].includes(tierName))  return 'rgba(96,165,250,0.7)'
  if (['C+', 'C', 'C-'].includes(tierName))  return 'rgba(167,139,250,0.6)'
  return 'rgba(156,163,175,0.5)'
}

function getTierRingColor(tierName) {
  if (!tierName) return 'border-gray-600'
  if (['S+', 'S', 'S-'].includes(tierName))  return 'border-yellow-400'
  if (['A+', 'A', 'A-'].includes(tierName))  return 'border-green-400'
  if (['B+', 'B', 'B-'].includes(tierName))  return 'border-blue-400'
  if (['C+', 'C', 'C-'].includes(tierName))  return 'border-purple-400'
  return 'border-gray-500'
}

export default function PlayerSlotCard({ pos, player, onClick }) {
  const [hovered, setHovered] = useState(false)
  const tierName = player?.tier?.name
  const glow = getTierGlow(tierName)
  const ring = getTierRingColor(tierName)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-1 group"
      style={{ transition: 'transform 0.2s', transform: hovered ? 'scale(1.1) translateY(-4px)' : 'scale(1)' }}
    >
      {/* Photo ring */}
      <div
        className={`relative rounded-full border-2 ${ring} overflow-hidden bg-gray-900`}
        style={{
          width: 'clamp(44px, 8vw, 72px)',
          aspectRatio: '1',
          boxShadow: player ? `0 0 16px 4px ${glow}` : '0 0 8px 2px rgba(255,255,255,0.1)',
        }}
      >
        {player ? (
          <>
            {player.headshot ? (
              <img
                src={player.headshot}
                alt={player.last_name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                {player.first_name?.[0]}{player.last_name?.[0]}
              </div>
            )}
            {/* Tier badge overlay */}
            <div className={`absolute bottom-0 right-0 text-black text-xs font-bold px-1 rounded-tl ${player.tier?.color ?? 'bg-gray-400'}`}
              style={{ fontSize: '0.6rem', lineHeight: '1.2' }}>
              {tierName}
            </div>
          </>
        ) : (
          /* Empty slot */
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl font-bold">
            +
          </div>
        )}
      </div>

      {/* Name + position label */}
      <div className="text-center" style={{ maxWidth: 'clamp(52px, 9vw, 80px)' }}>
        {player ? (
          <div className="text-white font-semibold truncate" style={{ fontSize: 'clamp(9px, 1.5vw, 12px)' }}>
            {player.last_name}
          </div>
        ) : null}
        <div className={`font-bold ${player ? 'text-gray-400' : 'text-gray-500'}`}
          style={{ fontSize: 'clamp(8px, 1.2vw, 11px)' }}>
          {pos}
        </div>
      </div>
    </button>
  )
}
