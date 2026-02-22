import { useState } from 'react'
import CourtView from '../components/CourtView'
import SwapDrawer from '../components/SwapDrawer'
import PlayerAvatar from '../components/PlayerAvatar'
import TierBadge from '../components/TierBadge'
import PlayerStatsPopup from '../components/PlayerStatsPopup'
import { SALARY_CAP } from '../utils/teamSetup'
import { useStarters, POS_ORDER } from '../hooks/useStarters'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getPlayerShortName } from '../data/playerNames'
import { getTierBorderClass } from '../utils/tiers'
import { OFFENSE_SCHEMES, DEFENSE_SCHEMES, loadSchemes, saveSchemes } from '../data/gameSchemes'

function SchemePickerPanel({ schemes, onChange }) {
  const { lang } = useSettings()
  return (
    <div className="bg-black/75 backdrop-blur-sm border border-gray-700/60 rounded-xl p-3">
      <div className="text-orange-400 font-bold mb-2 tracking-wide uppercase" style={{ fontSize: 10 }}>
        {t(T.schemes.title, lang)}
      </div>

      {/* Offense row */}
      <div className="text-gray-500 mb-1" style={{ fontSize: 9 }}>{t(T.schemes.offense, lang)}</div>
      <div className="flex gap-1 mb-2">
        {Object.keys(OFFENSE_SCHEMES).map(id => (
          <button
            key={id}
            onClick={() => onChange({ ...schemes, offense: id })}
            className="flex-1 rounded font-bold transition-colors"
            style={{
              fontSize: 9, padding: '2px 0',
              background: schemes.offense === id ? '#f97316' : '#1f2937',
              color: schemes.offense === id ? '#000' : '#9ca3af',
            }}
          >
            {t(T.schemes.short[id], lang)}
          </button>
        ))}
      </div>

      {/* Defense row */}
      <div className="text-gray-500 mb-1" style={{ fontSize: 9 }}>{t(T.schemes.defense, lang)}</div>
      <div className="flex gap-1">
        {Object.keys(DEFENSE_SCHEMES).map(id => (
          <button
            key={id}
            onClick={() => onChange({ ...schemes, defense: id })}
            className="flex-1 rounded font-bold transition-colors"
            style={{
              fontSize: 9, padding: '2px 0',
              background: schemes.defense === id ? '#3b82f6' : '#1f2937',
              color: schemes.defense === id ? '#000' : '#9ca3af',
            }}
          >
            {t(T.schemes.short[id], lang)}
          </button>
        ))}
      </div>
    </div>
  )
}

function BenchChip({ player, onDragStart }) {
  const { lang } = useSettings()
  const tierName = player.tier?.name
  const ringClass = getTierBorderClass(tierName)

  return (
    <div
      className="relative flex-shrink-0"
      draggable
      onDragStart={onDragStart}
      style={{ cursor: 'grab' }}
    >
      <div className="flex flex-col items-center gap-0.5">
        {/* Photo */}
        <div
          className={`relative rounded-lg border-2 ${ringClass} overflow-hidden bg-gray-900`}
          style={{ width: 58, height: 58 }}
        >
          {player.headshot ? (
            <img
              src={player.headshot}
              alt={player.last_name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
              {player.first_name?.[0]}{player.last_name?.[0]}
            </div>
          )}
          {/* Tier badge */}
          <div
            className={`absolute bottom-0 right-0 text-black font-bold px-0.5 rounded-tl ${player.tier?.color ?? 'bg-gray-400'}`}
            style={{ fontSize: '0.45rem', lineHeight: '1.4' }}
          >
            {tierName}
          </div>
        </div>

        {/* Name */}
        <div className="text-white font-semibold truncate text-center" style={{ fontSize: 11, maxWidth: 62 }}>
          {getPlayerShortName(player, lang)}
        </div>
        <div className="text-gray-400 text-center" style={{ fontSize: 10 }}>
          {(player.positions ?? [player.position]).join('/')}
        </div>
      </div>
    </div>
  )
}

export default function MyTeam({ team, salaryMap = {} }) {
  const { lang } = useSettings()
  const { team: roster, totalSalary, capRemaining, cash, resetTeam, dropPlayer } = team
  const { starters, assign, remove, swap } = useStarters(roster)
  const [drawer, setDrawer] = useState(null)
  const [hoverState, setHoverState] = useState(null) // { player, rect }
  const [dragOverPos, setDragOverPos] = useState(null) // slot pos or 'bench' or null
  const [schemes, setSchemes] = useState(() => loadSchemes())

  function handleSchemeChange(newSchemes) {
    setSchemes(newSchemes)
    saveSchemes(newSchemes)
  }

  function handleDragStart(fromPos, player, e) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ playerId: String(player.id), fromPos }))
  }

  function handleDropOnSlot(toPos, e) {
    e.preventDefault()
    setDragOverPos(null)
    try {
      const { playerId, fromPos } = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (fromPos === toPos) return
      if (fromPos === 'bench') {
        const player = roster.find(p => String(p.id) === playerId)
        if (player) assign(toPos, player)
      } else {
        swap(fromPos, toPos)
      }
    } catch {}
  }

  function handleDropOnBench(e) {
    e.preventDefault()
    setDragOverPos(null)
    try {
      const { fromPos } = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (fromPos && fromPos !== 'bench') remove(fromPos)
    } catch {}
  }

  const starterIds = Object.values(starters).filter(Boolean).map(p => p.id)
  const bench = roster.filter(p => !starterIds.includes(p.id))
  const starterCount = Object.values(starters).filter(Boolean).length

  const capPct = Math.min((totalSalary / SALARY_CAP) * 100, 100)
  const capColor = capPct > 90 ? '#ef4444' : capPct > 70 ? '#facc15' : '#22c55e'

  return (
    <div className="relative h-full overflow-hidden text-white">

      {/* Full-screen arena court as background */}
      <CourtView
        starters={starters}
        onSlotClick={(pos, player) => setDrawer({ pos, player })}
        onHoverPlayer={(player, rect) => setHoverState(player ? { player, rect } : null)}
        onDragStart={handleDragStart}
        onDropSlot={handleDropOnSlot}
        dragOverPos={dragOverPos}
        onDragOverSlot={setDragOverPos}
      />

      {/* Player stats popup (portal — renders outside overflow-hidden) */}
      {hoverState && (
        <PlayerStatsPopup player={hoverState.player} rect={hoverState.rect} />
      )}

      {/* ── Top-left: team info panel ── */}
      <div
        className="absolute top-3 left-3 z-20 flex flex-col gap-2"
        style={{ width: 'clamp(140px, 14vw, 190px)' }}
      >
        <div className="bg-black/75 backdrop-blur-sm border border-gray-700/60 rounded-xl p-3">
          {/* Title */}
          <div className="text-orange-400 font-bold text-sm mb-3 tracking-wide">
            范特西篮球
          </div>

          {/* Cash */}
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-gray-400 text-xs">{t(T.myTeam.cash, lang)}</span>
            <span className="text-green-400 font-bold text-sm">${cash}M</span>
          </div>

          {/* Cap Space */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs">{t(T.myTeam.capSpace, lang)}</span>
            <span
              className="font-bold text-sm"
              style={{ color: capRemaining < 10 ? '#ef4444' : '#60a5fa' }}
            >
              ${capRemaining}M
            </span>
          </div>

          {/* Cap bar */}
          <div className="w-full bg-gray-800 rounded-full h-1 mb-1">
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${capPct}%`, background: capColor }}
            />
          </div>
          <div className="flex justify-between text-gray-600" style={{ fontSize: 10 }}>
            <span>${totalSalary}M used</span>
            <span>{capPct.toFixed(0)}%</span>
          </div>

          {/* Roster count */}
          <div className="mt-2 pt-2 border-t border-gray-800 text-gray-500 text-xs">
            {t(T.myTeam.starterCount, lang, starterCount, roster.length)}
          </div>
        </div>

        {/* Scheme picker */}
        <SchemePickerPanel schemes={schemes} onChange={handleSchemeChange} />
      </div>

      {/* ── Top-right: hard reset button (DEV only) ── */}
      {import.meta.env.DEV && (
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => {
              if (window.confirm(t(T.myTeam.hardResetConfirm, lang))) {
                localStorage.clear()
                window.location.reload()
              }
            }}
            className="text-xs text-orange-700 hover:text-orange-400 bg-black/60 border border-orange-900/50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            {t(T.myTeam.hardReset, lang)}
          </button>
        </div>
      )}

      {/* ── Bottom bench strip (drop target for moving starters to bench) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20"
        onDragOver={e => { e.preventDefault(); setDragOverPos('bench') }}
        onDragLeave={() => setDragOverPos(null)}
        onDrop={handleDropOnBench}
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 60%, transparent 100%)',
          paddingTop: 32,
          paddingBottom: 14,
          paddingLeft: 16,
          paddingRight: 16,
          outline: dragOverPos === 'bench' ? '2px solid rgba(99,102,241,0.5)' : '2px solid transparent',
          outlineOffset: '-2px',
          transition: 'outline-color 0.12s',
        }}
      >
        <div className="flex items-center gap-1 mb-2">
          <span className="text-gray-400 font-semibold uppercase tracking-wider" style={{ fontSize: 10 }}>
            {t(T.myTeam.bench, lang)}
          </span>
          <span className="text-gray-600" style={{ fontSize: 10 }}>({bench.length})</span>
        </div>

        {bench.length === 0 ? (
          <p className="text-gray-600 text-xs pb-1">{t(T.myTeam.allStarting, lang)}</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {bench.map(p => (
              <BenchChip
                key={p.id}
                player={p}
                onDragStart={e => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', JSON.stringify({ playerId: String(p.id), fromPos: 'bench' }))
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* SwapDrawer */}
      {drawer && (
        <SwapDrawer
          pos={drawer.pos}
          currentPlayer={drawer.player}
          currentPlayerLiveSalary={drawer.player ? (salaryMap[String(drawer.player.id)] ?? null) : null}
          benchPlayers={bench.filter(p => p.id !== drawer.player?.id)}
          onAssign={assign}
          onRemove={remove}
          onSell={(playerId, liveSalary) => { dropPlayer(playerId, liveSalary); setDrawer(null) }}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}
