import { useSettings } from '../contexts/SettingsContext'
import { getPlayerShortName } from '../data/playerNames'
import { getTierBorderColor, getTierGlow } from '../utils/tiers'

export default function PlayerSlotCard({ pos, player, onClick, onHoverPlayer, onDragStart, isDragOver }) {
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
      draggable={!!player}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(e)
      }}
      style={{
        transition: 'transform 0.18s ease, filter 0.18s ease',
        cursor: player ? 'grab' : 'pointer',
      }}
      className="flex flex-col items-center group focus:outline-none hover:scale-110 hover:-translate-y-1.5 hover:brightness-110 transition-all duration-200"
    >
      {/* Card */}
      <div
        style={{
          width: 'clamp(113px, 11.9vw, 155px)',
          height: 'clamp(143px, 16.25vw, 200px)',
          border: isDragOver ? '2px solid rgba(99,102,241,0.9)' : `2px solid ${borderColor}`,
          borderRadius: 10,
          overflow: 'hidden',
          background: player ? '#0f172a' : 'rgba(15,23,42,0.55)',
          position: 'relative',
          boxShadow: isDragOver
            ? '0 0 24px 8px rgba(99,102,241,0.5), 0 4px 16px rgba(0,0,0,0.7)'
            : player
              ? `0 0 22px 5px ${glow}, 0 4px 16px rgba(0,0,0,0.7)`
              : '0 2px 8px rgba(0,0,0,0.5)',
          transition: 'border-color 0.12s, box-shadow 0.12s',
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
                style={{ fontSize: 'clamp(9px, 1.2vw, 13px)' }}
              >
                {getPlayerShortName(player, lang)}
              </span>
              <span
                className="text-green-400 font-bold leading-tight"
                style={{ fontSize: 'clamp(9px, 1.1vw, 12px)' }}
              >
                ${player.tier?.salary}M
              </span>
            </div>

            {/* Tier badge — top right */}
            <div
              className={`absolute top-0.5 right-0.5 text-black font-bold px-0.5 rounded ${player.tier?.color ?? 'bg-gray-400'}`}
              style={{ fontSize: '0.6rem', lineHeight: '1.4' }}
            >
              {tierName}
            </div>

            {/* Position — top left */}
            <div
              className="absolute top-0.5 left-0.5 text-gray-200 font-bold bg-black/60 px-0.5 rounded"
              style={{ fontSize: '0.6rem', lineHeight: '1.4' }}
            >
              {pos}
            </div>

          </>
        ) : (
          /* Empty slot */
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <div
              className="font-bold leading-none"
              style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', color: borderColor, opacity: 0.4 }}
            >
              +
            </div>
            <div
              className="font-bold text-gray-400"
              style={{ fontSize: 'clamp(11px, 1.4vw, 15px)' }}
            >
              {pos}
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
