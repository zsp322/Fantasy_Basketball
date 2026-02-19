import { useSettings } from '../contexts/SettingsContext'
import { getPlayerShortName } from '../data/playerNames'

function getTierBorderColor(tierName) {
  if (!tierName) return '#374151'
  if (['S+', 'S', 'S-'].includes(tierName)) return '#a855f7'   // purple
  if (['A+', 'A', 'A-'].includes(tierName)) return '#60a5fa'   // blue
  if (['B+', 'B', 'B-'].includes(tierName)) return '#22d3ee'   // cyan
  if (['C+', 'C', 'C-'].includes(tierName)) return '#4ade80'   // green
  return '#6b7280'                                              // gray D/F
}

function getTierGlow(tierName) {
  if (!tierName) return 'transparent'
  if (['S+', 'S', 'S-'].includes(tierName)) return 'rgba(168,85,247,0.6)'
  if (['A+', 'A', 'A-'].includes(tierName)) return 'rgba(96,165,250,0.55)'
  if (['B+', 'B', 'B-'].includes(tierName)) return 'rgba(34,211,238,0.5)'
  if (['C+', 'C', 'C-'].includes(tierName)) return 'rgba(74,222,128,0.5)'
  return 'rgba(156,163,175,0.3)'
}

export default function PlayerSlotCard({ pos, player, onClick, onHoverPlayer }) {
  const { lang } = useSettings()
  const tierName = player?.tier?.name
  const borderColor = getTierBorderColor(tierName)
  const glow = getTierGlow(tierName)

  function handleMouseEnter(e) {
    if (player && onHoverPlayer) {
      onHoverPlayer(player, e.currentTarget.getBoundingClientRect())
    }
  }

  function handleMouseLeave() {
    if (onHoverPlayer) onHoverPlayer(null, null)
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.18s ease, filter 0.18s ease',
        // hover handled via CSS :hover since we removed useState
      }}
      className="flex flex-col items-center group focus:outline-none hover:scale-110 hover:-translate-y-1.5 hover:brightness-110 transition-all duration-200"
    >
      {/* Card */}
      <div
        style={{
          width: 'clamp(90px, 9.5vw, 124px)',
          height: 'clamp(114px, 13vw, 160px)',
          border: `2px solid ${borderColor}`,
          borderRadius: 10,
          overflow: 'hidden',
          background: player ? '#0f172a' : 'rgba(15,23,42,0.55)',
          position: 'relative',
          boxShadow: player
            ? `0 0 22px 5px ${glow}, 0 4px 16px rgba(0,0,0,0.7)`
            : '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {player ? (
          <>
            {/* Photo */}
            {player.headshot ? (
              <img
                src={player.headshot}
                alt={player.last_name}
                style={{ width: '100%', height: '65%', objectFit: 'cover', objectPosition: 'top' }}
              />
            ) : (
              <div
                style={{ height: '65%', background: '#1e293b' }}
                className="flex items-center justify-center text-white font-bold text-xl"
              >
                {player.first_name?.[0]}{player.last_name?.[0]}
              </div>
            )}

            {/* Bottom strip — name + salary */}
            <div
              style={{ height: '35%', background: 'rgba(0,0,0,0.9)' }}
              className="flex flex-col items-center justify-center px-1 gap-0.5"
            >
              <span
                className="text-white font-semibold truncate leading-tight w-full text-center"
                style={{ fontSize: 'clamp(8px, 1.1vw, 11px)' }}
              >
                {getPlayerShortName(player, lang)}
              </span>
              <span
                className="text-green-400 font-bold leading-tight"
                style={{ fontSize: 'clamp(8px, 1vw, 10px)' }}
              >
                ${player.tier?.salary}M
              </span>
            </div>

            {/* Tier badge — top right */}
            <div
              className={`absolute top-0.5 right-0.5 text-black font-bold px-0.5 rounded ${player.tier?.color ?? 'bg-gray-400'}`}
              style={{ fontSize: '0.5rem', lineHeight: '1.4' }}
            >
              {tierName}
            </div>

            {/* Position — top left */}
            <div
              className="absolute top-0.5 left-0.5 text-gray-200 font-bold bg-black/60 px-0.5 rounded"
              style={{ fontSize: '0.5rem', lineHeight: '1.4' }}
            >
              {pos}
            </div>
          </>
        ) : (
          /* Empty slot */
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <div
              className="font-bold leading-none"
              style={{ fontSize: 'clamp(22px, 2.8vw, 32px)', color: borderColor, opacity: 0.4 }}
            >
              +
            </div>
            <div
              className="font-bold text-gray-500"
              style={{ fontSize: 'clamp(10px, 1.2vw, 13px)' }}
            >
              {pos}
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
