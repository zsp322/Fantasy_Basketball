import { useState, useEffect, useRef } from 'react'
import PlayerAvatar from './PlayerAvatar'
import TierBadge from './TierBadge'
import PlayerStatsPopup from './PlayerStatsPopup'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getPlayerName } from '../data/playerNames'

function getTierBorderColor(tierName) {
  if (!tierName) return '#374151'
  if (['S+', 'S', 'S-'].includes(tierName)) return '#a855f7'
  if (['A+', 'A', 'A-'].includes(tierName)) return '#60a5fa'
  if (['B+', 'B', 'B-'].includes(tierName)) return '#14b8a6'
  if (['C+', 'C', 'C-'].includes(tierName)) return '#4ade80'
  return '#6b7280'
}

export default function TeamReveal({ foundational, initialAutoPlayers, onConfirm, generateAuto }) {
  const { lang } = useSettings()
  const [autoPlayers, setAutoPlayers] = useState(initialAutoPlayers)
  const [revealedCount, setRevealedCount] = useState(0)
  const [regenerating, setRegenerating] = useState(false)
  const [hoverState, setHoverState] = useState(null) // { player, rect }
  const cardRefs = useRef({})

  const allPlayers = [foundational, ...autoPlayers]
  const allRevealed = revealedCount >= allPlayers.length

  // Reveal cards one by one
  useEffect(() => {
    if (revealedCount >= allPlayers.length) return
    if (regenerating) return // pause during shuffle-out
    const delay = revealedCount === 0 ? 400 : 500
    const timer = setTimeout(() => setRevealedCount(c => c + 1), delay)
    return () => clearTimeout(timer)
  }, [revealedCount, allPlayers.length, regenerating])

  function handleRegenerate() {
    if (regenerating) return
    setHoverState(null)
    setRegenerating(true)
    // Instantly set revealedCount to 1 — foundational stays, all auto cards fade out
    setRevealedCount(1)
    // After CSS transition completes, swap in new players and resume reveal
    setTimeout(() => {
      setAutoPlayers(generateAuto())
      setRegenerating(false)
      // revealedCount stays at 1; useEffect resumes from position 1
    }, 450)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-6 py-12">
      <h1 className="text-4xl font-bold mb-1">范特西篮球</h1>
      <p className="text-gray-400 text-sm mb-10">{t(T.teamReveal.title, lang)}</p>

      {/* Hover popup (portal) */}
      {hoverState && (
        <PlayerStatsPopup player={hoverState.player} rect={hoverState.rect} lang={lang} />
      )}

      {/* Player grid */}
      <div className="flex gap-4 flex-wrap justify-center max-w-4xl w-full mb-10">
        {allPlayers.map((player, i) => {
          const isFoundational = i === 0
          const revealed = i < revealedCount
          const borderColor = isFoundational ? '#facc15' : getTierBorderColor(player.tier?.name)
          const glowColor = isFoundational
            ? 'rgba(250,204,21,0.3)'
            : `${getTierBorderColor(player.tier?.name)}44`
          const cardKey = `${player.id}-${i}`

          return (
            <div
              key={cardKey}
              ref={el => { cardRefs.current[cardKey] = el }}
              onMouseEnter={() => {
                if (!revealed) return
                const el = cardRefs.current[cardKey]
                if (el) setHoverState({ player, rect: el.getBoundingClientRect() })
              }}
              onMouseLeave={() => setHoverState(null)}
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.92)',
                transition: 'opacity 0.45s ease, transform 0.45s ease',
                width: 140,
                borderColor,
                boxShadow: revealed ? `0 0 16px 4px ${glowColor}, 0 4px 12px rgba(0,0,0,0.5)` : 'none',
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center flex-shrink-0 ${
                isFoundational ? 'bg-yellow-400/10' : 'bg-gray-900'
              }`}
            >
              {isFoundational && (
                <div className="text-yellow-400 text-xs font-bold tracking-wide">
                  {t(T.teamReveal.cornerstone, lang)}
                </div>
              )}
              <PlayerAvatar player={player} size="md" />
              <div className="w-full">
                <div className="text-white font-semibold text-sm leading-tight truncate">
                  {getPlayerName(player, lang)}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                  {(player.positions ?? [player.position]).join('/')}
                </div>
              </div>
              <TierBadge tier={player.tier} size="sm" />
            </div>
          )
        })}
      </div>

      {/* Action buttons — fade in when all revealed */}
      <div
        style={{
          opacity: allRevealed ? 1 : 0,
          transform: allRevealed ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
          pointerEvents: allRevealed ? 'auto' : 'none',
        }}
        className="flex items-center gap-4"
      >
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
        >
          {t(T.teamReveal.shuffle, lang)}
        </button>
        <button
          onClick={onConfirm}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-10 py-3 rounded-xl text-lg transition-colors"
        >
          {t(T.teamReveal.startPlaying, lang)}
        </button>
      </div>
    </div>
  )
}
