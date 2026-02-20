import { useState, useRef } from 'react'
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

export default function FoundationalPick({ sPlayers, onPick }) {
  const { lang } = useSettings()
  const [selected, setSelected] = useState(null)
  const [hoverState, setHoverState] = useState(null) // { player, rect }
  const cardRefs = useRef({})

  const stat = (val) => val != null ? Number(val).toFixed(1) : '—'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-12">
      <h1 className="text-4xl font-bold mb-1">范特西篮球</h1>

      {/* Hover popup (portal) */}
      {hoverState && (
        <PlayerStatsPopup player={hoverState.player} rect={hoverState.rect} lang={lang} />
      )}

      <div className="bg-gray-900 border border-yellow-400/30 rounded-2xl p-6 max-w-3xl w-full mt-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⭐</span>
          <div>
            <h2 className="text-xl font-bold text-yellow-400">{t(T.foundational.title, lang)}</h2>
            <p className="text-gray-400 text-sm">{t(T.foundational.subtitle, lang)}</p>
          </div>
        </div>

        {/* Roster note */}
        <div className="mb-5 px-3 py-2 bg-blue-900/30 border border-blue-700/40 rounded-lg text-blue-300 text-xs">
          ℹ {t(T.foundational.rosterNote, lang)}
        </div>

        {/* 5-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {sPlayers.map(player => {
            const isSelected = selected?.id === player.id
            return (
              <button
                key={player.id}
                ref={el => { cardRefs.current[player.id] = el }}
                onClick={() => setSelected(player)}
                onMouseEnter={() => {
                  const el = cardRefs.current[player.id]
                  if (el) setHoverState({ player, rect: el.getBoundingClientRect() })
                }}
                onMouseLeave={() => setHoverState(null)}
                style={{
                  borderColor: isSelected ? '#facc15' : getTierBorderColor(player.tier?.name),
                  boxShadow: isSelected ? `0 0 14px 3px rgba(250,204,21,0.25)` : `0 0 10px 2px ${getTierBorderColor(player.tier?.name)}33`,
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? 'bg-yellow-400/10 scale-105'
                    : 'bg-gray-800 hover:scale-102 hover:brightness-110'
                }`}
              >
                <PlayerAvatar player={player} size="md" />
                <div className="w-full">
                  <div className="font-semibold text-sm leading-tight">
                    {getPlayerName(player, lang)}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    {player.avg?.teamAbbr ?? '—'} · {player.position || '—'}
                  </div>
                  <div className="text-gray-300 text-xs mt-1">
                    {stat(player.avg?.pts)} PTS · {stat(player.avg?.ast)} AST
                  </div>
                  <div className="text-gray-300 text-xs">
                    {stat(player.avg?.reb)} REB
                  </div>
                </div>
                <TierBadge tier={player.tier} size="sm" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Confirm strip */}
      {selected && (
        <div className="mt-6 max-w-3xl w-full bg-gray-900 border border-yellow-400/50 rounded-2xl p-4 flex items-center gap-4">
          <PlayerAvatar player={selected} size="md" />
          <div className="flex-1">
            <div className="font-bold text-yellow-400">{getPlayerName(selected, lang)}</div>
            <div className="text-gray-400 text-sm">
              {selected.tier?.name} · ${selected.tier?.salary}M {t(T.foundational.salary, lang)}
            </div>
          </div>
          <button
            onClick={() => onPick(selected)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl transition-colors"
          >
            {t(T.foundational.lockIn, lang)}
          </button>
        </div>
      )}
    </div>
  )
}
