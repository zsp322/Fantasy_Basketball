import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTeam } from '../hooks/useTeam'
import { useStarters, POS_ORDER } from '../hooks/useStarters'
import { simulateGame, resumeSimulation, getEnergyMultiplier, getPosMismatchMult } from '../utils/gameEngine'
import { pickZoneText } from '../data/playTexts'
import { npcStarters, npcBench, NPC_TEAM_NAME, NPC_TEAM_SHORT, NPC_TEAM_LOGO } from '../data/npcTeam'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getPlayerShortName, getPlayerName } from '../data/playerNames'
import { getTierBorderColor } from '../utils/tiers'

const SPEEDS = [
  { labelKey: 'slow',   ms: 500 },
  { labelKey: 'normal', ms: 200 },
  { labelKey: 'fast',   ms: 60  },
]
const PAUSE_SECONDS = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(p) {
  return `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`
}

// ─── Energy bar ───────────────────────────────────────────────────────────────
function EnergyBar({ value }) {
  if (value == null) return null
  const pct = Math.max(0, Math.min(value, 100))
  const color =
    pct >= 70 ? '#22c55e' :
    pct >= 50 ? '#facc15' :
    pct >= 30 ? '#f97316' : '#ef4444'
  return (
    <div className="w-full bg-gray-800 rounded-full" style={{ height: 4 }}>
      <div className="rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, height: 4, background: color }} />
    </div>
  )
}

// ─── Stat tooltip — rendered via portal with fixed positioning ────────────────
function StatTooltip({ player, energyPct, rect, side, lang }) {
  const energy  = energyPct ?? 100
  const eMult   = getEnergyMultiplier(energy)
  const pMult   = getPosMismatchMult(player.position, player.playingAs ?? player.position, player.positions)
  const baseAtk = player.offenseRating ?? 0
  const baseDef = player.defenseRating ?? 0
  const effAtk  = Math.round(baseAtk * pMult * eMult)
  const effDef  = Math.round(baseDef * pMult * eMult)
  const hasMismatch = pMult < 1.0
  const mismatchPct = Math.round((1 - pMult) * 100)

  const W = 162
  // Position tooltip to the right for left-column, left for right-column
  const left = side === 'left' ? rect.right + 8 : rect.left - W - 8
  const top  = Math.max(8, Math.min(rect.top, (window.innerHeight || 800) - 220))

  // i18n labels
  const ui = lang === 'zh'
    ? { title: '实时数据', atk: '进攻', def: '防守', energy: '体力', penalty: '位置惩罚' }
    : { title: 'Live Stats', atk: 'ATK', def: 'DEF', energy: 'Energy', penalty: 'Pos penalty' }

  return createPortal(
    <div
      style={{
        position: 'fixed', left, top, width: W, zIndex: 9999,
        background: '#030712', border: '1px solid #374151',
        borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        padding: '10px 12px', fontSize: 11, pointerEvents: 'none',
      }}
    >
      {/* Player name */}
      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 12, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {getPlayerShortName(player, lang)}
      </div>
      <div style={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontSize: 9 }}>
        {ui.title}
      </div>

      {/* ATK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: '#fb923c', fontWeight: 700 }}>{ui.atk}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#6b7280' }}>{baseAtk}</span>
          <span style={{ color: '#4b5563' }}>→</span>
          <span style={{ color: '#fdba74', fontWeight: 700 }}>{effAtk}</span>
        </div>
      </div>

      {/* DEF */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#60a5fa', fontWeight: 700 }}>{ui.def}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#6b7280' }}>{baseDef}</span>
          <span style={{ color: '#4b5563' }}>→</span>
          <span style={{ color: '#93c5fd', fontWeight: 700 }}>{effDef}</span>
        </div>
      </div>

      {/* Energy */}
      <div style={{ borderTop: '1px solid #1f2937', paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#6b7280' }}>{ui.energy}</span>
          <span style={{
            fontWeight: 700,
            color: energy >= 70 ? '#22c55e' : energy >= 50 ? '#facc15' : energy >= 30 ? '#f97316' : '#ef4444'
          }}>
            {Math.round(energy)}%
          </span>
        </div>
        <EnergyBar value={energy} />
      </div>

      {/* Position mismatch */}
      {hasMismatch && (
        <div style={{ marginTop: 8, borderTop: '1px solid #1f2937', paddingTop: 8, color: mismatchPct >= 35 ? '#f87171' : '#fbbf24', fontWeight: 600, fontSize: 10 }}>
          {(player.positions ?? [player.position]).join('/')}→{player.playingAs} {ui.penalty} −{mismatchPct}%
        </div>
      )}

      {/* Multiplier breakdown */}
      <div style={{ marginTop: 4, color: '#374151', fontSize: 9 }}>
        ×{eMult.toFixed(2)} {lang === 'zh' ? '体力' : 'nrg'}{hasMismatch ? ` · ×${pMult.toFixed(2)} ${lang === 'zh' ? '位置' : 'pos'}` : ''}
      </div>
    </div>,
    document.body
  )
}

// ─── Zone badge helper ─────────────────────────────────────────────────────────
function ZoneBadge({ zone }) {
  if (!zone) return null
  const cfg = {
    fire:   { emoji: '🔥🔥', bg: 'rgba(234,88,12,0.85)',   shadow: '0 0 8px rgba(251,146,60,0.8)' },
    hot:    { emoji: '🔥',   bg: 'rgba(245,158,11,0.80)',   shadow: '0 0 6px rgba(251,191,36,0.7)' },
    cold:   { emoji: '❄️',   bg: 'rgba(59,130,246,0.75)',   shadow: '0 0 6px rgba(147,197,253,0.6)' },
    frozen: { emoji: '❄️❄️', bg: 'rgba(30,64,175,0.85)',   shadow: '0 0 8px rgba(96,165,250,0.8)' },
  }[zone]
  if (!cfg) return null
  return (
    <div style={{
      position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
      background: cfg.bg, boxShadow: cfg.shadow,
      borderRadius: 6, padding: '1px 5px', fontSize: 10, fontWeight: 700,
      whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
    }}>
      {cfg.emoji}
    </div>
  )
}

// ─── Bigger vertical player card ──────────────────────────────────────────────
function PlayerCardV({ player, energyPct, side, onClick, showSwapHint, lang, zone }) {
  const [hoverRect, setHoverRect] = useState(null)
  const cardRef = useRef(null)
  const tierName    = player?.tier?.name
  const borderColor = getTierBorderColor(tierName)
  const isGassed    = energyPct != null && energyPct < 30

  const eligiblePositions = player.positions ?? [player.position]
  const slotPos           = player.playingAs ?? player.position
  const hasMismatch       = !eligiblePositions.includes(slotPos)
  const pMult             = getPosMismatchMult(player.position, slotPos, eligiblePositions)
  const mismatchPct       = Math.round((1 - pMult) * 100)
  const mismatchSevere    = pMult < 0.65
  const posLabel          = eligiblePositions.join('/')

  function handleMouseEnter() {
    if (cardRef.current) setHoverRect(cardRef.current.getBoundingClientRect())
  }
  function handleMouseLeave() { setHoverRect(null) }
  function handleClick() {
    if (onClick && cardRef.current) onClick(player, cardRef.current.getBoundingClientRect())
  }

  const zoneGlow = zone === 'fire'   ? '0 0 18px 6px rgba(251,146,60,0.65), '
                 : zone === 'hot'    ? '0 0 12px 4px rgba(251,191,36,0.5), '
                 : zone === 'frozen' ? '0 0 18px 6px rgba(96,165,250,0.65), '
                 : zone === 'cold'   ? '0 0 12px 4px rgba(147,197,253,0.45), '
                 : ''

  return (
    <div ref={cardRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${isGassed ? 'opacity-55' : 'opacity-100'}`}
      style={{ width: 'clamp(88px, 10vw, 118px)' }}
    >
      <button
        onClick={handleClick}
        disabled={!onClick}
        className={`focus:outline-none w-full flex flex-col items-center gap-1 ${onClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} transition-transform duration-200`}
      >
        {/* Photo card */}
        <div style={{ position: 'relative', width: 'clamp(80px, 9vw, 110px)' }}>
          <ZoneBadge zone={zone} />
        <div
          style={{
            width: '100%',
            height: 'clamp(90px, 10vw, 120px)',
            border: `2px solid ${mismatchSevere ? '#ef4444' : hasMismatch ? '#f59e0b' : borderColor}`,
            borderRadius: 10,
            overflow: 'hidden',
            background: '#0f172a',
            position: 'relative',
            boxShadow: mismatchSevere
              ? `0 0 18px 4px rgba(239,68,68,0.4), 0 4px 16px rgba(0,0,0,0.7)`
              : `${zoneGlow}0 0 16px 3px ${borderColor}55, 0 4px 16px rgba(0,0,0,0.7)`,
          }}
        >
          {player.headshot ? (
            <img src={player.headshot} alt={player.last_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#1e293b' }}
              className="flex items-center justify-center text-white font-bold text-xl">
              {getInitials(player)}
            </div>
          )}

          {/* Tier badge */}
          {tierName && (
            <div className={`absolute top-0.5 right-0.5 text-black font-bold px-0.5 rounded ${player.tier?.color ?? 'bg-gray-400'}`}
              style={{ fontSize: '0.5rem', lineHeight: '1.4' }}>
              {tierName}
            </div>
          )}

          {/* Position mismatch badge */}
          {hasMismatch && (
            <div
              className={`absolute bottom-0 left-0 right-0 text-center font-bold py-0.5
                ${mismatchSevere ? 'bg-red-900/90 text-red-300' : 'bg-amber-900/90 text-amber-300'}`}
              style={{ fontSize: '0.5rem', lineHeight: 1.4 }}
            >
              {posLabel}→{slotPos} −{mismatchPct}%
            </div>
          )}

          {/* Swap hint on hover */}
          {showSwapHint && onClick && (
            <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-orange-300 font-bold text-xs bg-black/60 px-1 rounded">SUB</span>
            </div>
          )}
        </div>
        </div>{/* end zone wrapper */}

        {/* Name */}
        <div className="text-white font-semibold truncate text-center w-full" style={{ fontSize: 10 }}>
          {getPlayerShortName(player, lang)}
        </div>

        {/* Position + energy % */}
        <div className="text-gray-500 text-center" style={{ fontSize: 9 }}>
          {hasMismatch ? `${posLabel}·${slotPos}` : posLabel}
          {energyPct != null ? ` · ${Math.round(energyPct)}%` : ''}
        </div>

        {/* Energy bar */}
        <div className="w-full px-1">
          <EnergyBar value={energyPct} />
        </div>
      </button>

      {/* Stat tooltip via portal */}
      {hoverRect && (
        <StatTooltip player={player} energyPct={energyPct} rect={hoverRect} side={side} lang={lang} />
      )}
    </div>
  )
}

// ─── Live box score from visible plays (for the mid-game float overlay) ──────
function computeLiveBoxScore(plays) {
  const boxes = {}
  function box(id) {
    if (!boxes[id]) boxes[id] = { pts: 0, ast: 0, to: 0, stl: 0, blk: 0, foul: 0, fga: 0, fgm: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0, player: null }
    return boxes[id]
  }
  for (const play of plays) {
    if (play.isSub) continue
    const atk = play.attacker
    const def = play.defender
    if (atk) {
      const b = box(atk.id)
      b.player = atk
      if (play.turnover) { b.to++ }
      else if (play.shotType === 'FT') { b.fta += 2; b.ftm += (play.ftMade ?? 0); b.pts += play.points }
      else if (play.shotType) {
        b.fga++
        if (play.shotType === '3pt') { b.fg3a++; if (play.made) { b.fg3m++; b.fgm++; b.pts += 3 } }
        else { if (play.made) { b.fgm++; b.pts += 2 } }
      }
    }
    if (play.assister && play.made && play.shotType !== 'FT') {
      const b = box(play.assister.id)
      b.player = play.assister
      b.ast++
    }
    if (def) {
      const b = box(def.id)
      b.player = def
      if (play.specialEvent === 'steal') b.stl++
      if (play.specialEvent === 'block') b.blk++
      if (play.shotType === 'FT') b.foul++  // shooting foul committed
    }
  }
  return boxes
}

// ─── Full box score for game-end display — scans ALL plays across all subs ───
// Returns { myTeam: { [id]: box }, npcTeam: { [id]: box } }
// Each box: pts, reb, ast, stl, blk, to, fga, fgm, fg3a, fg3m, min
function computeFinalBoxScore(plays) {
  const myTeam  = {}
  const npcTeam = {}

  function getBox(boxes, id) {
    if (!boxes[id]) boxes[id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0, fga: 0, fgm: 0, fg3a: 0, fg3m: 0, appearances: 0, player: null }
    return boxes[id]
  }

  for (const play of plays) {
    if (play.isSub) continue
    const atkBoxes = play.teamIndex === 0 ? myTeam  : npcTeam
    const defBoxes = play.teamIndex === 0 ? npcTeam : myTeam
    const atk = play.attacker
    const def = play.defender

    if (atk) {
      const b = getBox(atkBoxes, atk.id)
      b.player = atk
      b.appearances++
      if (play.turnover) {
        b.to++
      } else if (play.shotType === 'FT') {
        b.fta = (b.fta ?? 0) + 2
        b.ftm = (b.ftm ?? 0) + (play.ftMade ?? 0)
        b.pts += play.points
      } else if (play.shotType) {
        b.fga++
        if (play.shotType === '3pt') { b.fg3a++; if (play.made) { b.fg3m++; b.fgm++; b.pts += 3 } }
        else { if (play.made) { b.fgm++; b.pts += 2 } }
        if (play.specialEvent === 'off_reb') b.reb++
      }
    }

    if (play.assister && play.made && play.shotType !== 'FT') {
      const b = getBox(atkBoxes, play.assister.id)
      b.player = play.assister
      b.ast++
    }

    if (def) {
      const b = getBox(defBoxes, def.id)
      b.player = def
      b.appearances++
      if (play.specialEvent === 'steal') b.stl++
      if (play.specialEvent === 'block') b.blk++
      if (play.shotType === 'FT') b.foul++  // shooting foul committed
      // Defensive rebound on a missed shot with no steal
      if (!play.made && !play.turnover && play.specialEvent !== 'steal' && play.specialEvent !== 'off_reb') {
        if (Math.random() < 0.70) b.reb++
      }
    }
  }

  // Compute MIN: appearances × 1.5, capped at 48
  for (const boxes of [myTeam, npcTeam]) {
    for (const id in boxes) {
      boxes[id].min = Math.min(48, Math.round(boxes[id].appearances * 1.5))
    }
  }

  return { myTeam, npcTeam }
}

// ─── Paused live box score overlay ────────────────────────────────────────────
function LiveBoxScoreFloat({ myStartersList, currentNpcActive, visiblePlays, onClose, lang }) {
  const boxes = useMemo(() => computeLiveBoxScore(visiblePlays), [visiblePlays])

  const myLabel  = lang === 'zh' ? '我的球队' : 'My Team'
  const npcLabel = NPC_TEAM_SHORT
  const hdrs     = lang === 'zh'
    ? ['球员', '分', '出手', '三分', '抢断', '盖帽', '失误', '犯规']
    : ['Player', 'PTS', 'FG', '3PT', 'STL', 'BLK', 'TO', 'FOUL']

  function rows(players) {
    return players.map(p => {
      const b = boxes[p.id]
      return (
        <tr key={p.id} className="border-b border-gray-800/40">
          <td className="px-2 py-1 text-white font-medium text-xs whitespace-nowrap">
            {getPlayerShortName(p, lang)}
            <span className="text-gray-400 ml-1 text-xs">{p.playingAs ?? p.position}</span>
          </td>
          <td className="px-2 py-1 text-right text-orange-300 font-bold text-xs">{b?.pts ?? 0}</td>
          <td className="px-2 py-1 text-right text-gray-400 text-xs">{b?.fgm ?? 0}/{b?.fga ?? 0}</td>
          <td className="px-2 py-1 text-right text-gray-400 text-xs">{b?.fg3m ?? 0}/{b?.fg3a ?? 0}</td>
          <td className="px-2 py-1 text-right text-yellow-300 text-xs">{b?.stl ?? 0}</td>
          <td className="px-2 py-1 text-right text-purple-300 text-xs">{b?.blk ?? 0}</td>
          <td className="px-2 py-1 text-right text-red-400 text-xs">{b?.to ?? 0}</td>
          <td className="px-2 py-1 text-right text-pink-300 text-xs">{b?.foul ?? 0}</td>
        </tr>
      )
    })
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 9998, minWidth: 360, maxWidth: 540, width: '90vw',
        background: '#030712', border: '1px solid #374151',
        borderRadius: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
        overflow: 'hidden',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <span className="text-white font-bold text-sm">
          {t(T.simulate.liveBoxScore, lang)}
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg px-1">✕</button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {/* My team */}
        <div className="px-3 py-1.5 text-orange-400 font-bold text-xs uppercase tracking-wide">{myLabel}</div>
        <table className="w-full">
          <thead>
            <tr className="text-gray-600 border-b border-gray-800/60">
              {hdrs.map(h => <th key={h} className={`px-2 py-1 font-medium text-xs ${h === hdrs[0] ? 'text-left' : 'text-right'}`}>{h}</th>)}
            </tr>
          </thead>
          <tbody>{rows(myStartersList)}</tbody>
        </table>

        {/* NPC team */}
        <div className="px-3 py-1.5 mt-1 text-yellow-400 font-bold text-xs uppercase tracking-wide border-t border-gray-800">{npcLabel}</div>
        <table className="w-full">
          <thead>
            <tr className="text-gray-600 border-b border-gray-800/60">
              {hdrs.map(h => <th key={h} className={`px-2 py-1 font-medium text-xs ${h === hdrs[0] ? 'text-left' : 'text-right'}`}>{h}</th>)}
            </tr>
          </thead>
          <tbody>{rows(currentNpcActive)}</tbody>
        </table>
      </div>
    </div>,
    document.body
  )
}

// ─── Bench swap panel — fixed-positioned portal, pops out beside the card ─────
function BenchSwapPanel({ swapTarget, bench, onSwap, onClose, lang }) {
  // swapTarget = { player, rect, side }
  if (!swapTarget) return null
  const { player, rect, side } = swapTarget
  const W = 230
  const left = side === 'left' ? rect.right + 8 : rect.left - W - 8
  const top  = Math.max(8, Math.min(rect.top, (window.innerHeight || 800) - 350))

  const pos = player.playingAs ?? player.position

  return createPortal(
    <>
      {/* Dismiss backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        style={{
          position: 'fixed', left, top, width: W, zIndex: 9999,
          background: '#030712', border: '1px solid #374151',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
          <div>
            <span className="text-white font-bold text-sm">{pos} </span>
            <span className="text-gray-500 text-xs">
              {t(T.simulate.subPlayer, lang)}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg px-1">✕</button>
        </div>

        {/* Current player */}
        <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/60">
          <div className="text-gray-600 text-xs mb-0.5 uppercase tracking-wide">
            {t(T.simulate.currentPlayer, lang)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">{getPlayerName(player, lang)}</span>
            <span className={`text-xs font-bold px-1 py-0.5 rounded text-black ${player.tier?.color ?? 'bg-gray-500'}`}>
              {player.tier?.name ?? '—'}
            </span>
          </div>
        </div>

        {/* Bench list */}
        <div className="max-h-64 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
          <div className="text-gray-600 text-xs mb-2 uppercase tracking-wide px-1">
            {bench.length === 0
              ? t(T.simulate.noBenchSub, lang)
              : t(T.simulate.selectSub, lang)}
          </div>
          <div className="flex flex-col gap-1.5">
            {bench.map(p => {
              const pm  = getPosMismatchMult(p.position, pos, p.positions)
              const pen = Math.round((1 - pm) * 100)
              const severe = pen >= 35
              const mild   = pen > 0 && !severe

              // Effective ATK/DEF at this slot (energy 100% for bench player)
              const effAtk = Math.round((p.offenseRating ?? 0) * pm)
              const effDef = Math.round((p.defenseRating ?? 0) * pm)

              return (
                <button
                  key={p.id}
                  onClick={() => onSwap(p)}
                  style={{
                    borderColor: severe ? '#7f1d1d' : mild ? '#78350f' : '#1f2937',
                    background:  severe ? 'rgba(127,29,29,0.18)' : mild ? 'rgba(120,53,15,0.15)' : '#111827',
                  }}
                  className="flex items-center gap-2 hover:brightness-125 border rounded-lg px-2.5 py-2 text-left transition-all w-full"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-white font-semibold text-xs truncate">{getPlayerName(p, lang)}</span>
                      {pen > 0 && (
                        <span className={`text-xs font-bold px-1 rounded ${severe ? 'bg-red-900/60 text-red-400' : 'bg-amber-900/60 text-amber-400'}`}>
                          {(p.positions ?? [p.position]).join('/')}→{pos} −{pen}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs" style={{ fontSize: 10 }}>
                      <span className="text-orange-400">
                        {t(T.shared.atk, lang)} <span className="font-bold">{effAtk}</span>
                        {pen > 0 && <span className="text-gray-600 ml-0.5">({p.offenseRating})</span>}
                      </span>
                      <span className="text-blue-400">
                        {t(T.shared.def, lang)} <span className="font-bold">{effDef}</span>
                        {pen > 0 && <span className="text-gray-600 ml-0.5">({p.defenseRating})</span>}
                      </span>
                      <span className="text-gray-400">{(p.positions ?? [p.position]).join('/')}</span>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-1 py-0.5 rounded text-black shrink-0 ${p.tier?.color ?? 'bg-gray-600'}`}>
                    {p.tier?.name ?? '—'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Team column (vertical list) ──────────────────────────────────────────────
function TeamColumn({ label, players, energies, zones, side, canSwap, onCardClick, lang }) {
  return (
    <div
      className="relative flex-shrink-0 flex flex-col h-full"
      style={{
        width: 'clamp(100px, 12vw, 148px)',
        borderRight: side === 'left' ? '1px solid rgba(55,65,81,0.4)' : undefined,
        borderLeft:  side === 'right' ? '1px solid rgba(55,65,81,0.4)' : undefined,
      }}
    >
      {/* Label */}
      <div
        className={`flex-shrink-0 px-2 py-2 font-bold tracking-wider uppercase truncate ${side === 'left' ? 'text-orange-400 text-left' : 'text-yellow-400 text-right'}`}
        style={{ fontSize: 9 }}
      >
        {label}
      </div>

      {/* Player cards */}
      <div
        className={`flex-1 flex flex-col gap-2 px-2 pb-2 overflow-y-auto items-${side === 'left' ? 'start' : 'end'}`}
        style={{ scrollbarWidth: 'none' }}
      >
        {players.map(p => (
          <PlayerCardV
            key={p.id}
            player={p}
            energyPct={energies?.[p.id] ?? null}
            zone={zones?.[p.id] ?? null}
            side={side}
            onClick={canSwap ? (player, rect) => onCardClick(player, rect, side) : undefined}
            showSwapHint={canSwap}
            lang={lang}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Play log row ─────────────────────────────────────────────────────────────
function PlayRow({ play, isNew, lang }) {
  const desc = lang === 'zh'
    ? (play.description?.zh || play.description?.en || play.description || '')
    : (play.description?.en || play.description || '')

  // Zone notification text (shown below the play if player just entered a zone)
  const zoneNotif = play.zoneEntered && play.attacker
    ? (() => {
        const t = pickZoneText(play.zoneEntered)
        if (!t) return null
        const name = getPlayerShortName(play.attacker, lang)
        return lang === 'zh'
          ? t.zh.replace('{atk}', name)
          : t.en.replace('{atk}', name)
      })()
    : null

  // Quarter label: Q1-Q4 or "OT"
  const otNum  = play.quarter > 4 ? play.quarter - 4 : 0
  const qLabel = otNum > 0 ? (otNum === 1 ? 'OT' : `${otNum}OT`) : `Q${play.quarter}`

  // Clock: compute time remaining in this quarter from possIdx
  let clockStr = null
  if (play.possIdx != null) {
    const isOT = play.quarter > 4
    const totalSecs = isOT ? 300 : 720     // 5 min OT, 12 min regular
    const playsPerQ = isOT ? 20 : 40       // OT_POSS×2=20, POSS_PER_Q×2=40
    const secPerPlay = totalSecs / playsPerQ
    const remaining = Math.max(0, totalSecs - (play.possIdx + 1) * secPerPlay)
    const mm = Math.floor(remaining / 60)
    const ss = Math.round(remaining % 60)
    clockStr = `${mm}:${ss.toString().padStart(2, '0')}`
  }

  if (play.isSub) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1 ${isNew ? 'bg-white/5' : ''}`} style={{ fontSize: 13 }}>
        <span className="text-gray-600 shrink-0" style={{ fontSize: 11, minWidth: 20 }}>{qLabel}</span>
        <span className="text-cyan-600 italic flex-1">{desc}</span>
        <span className="text-gray-700 shrink-0" style={{ fontSize: 11 }}>({play.score[0]}–{play.score[1]})</span>
      </div>
    )
  }

  const isMy    = play.teamIndex === 0
  const isScore = play.points > 0
  const isBlock = play.specialEvent === 'block'
  const isSteal = play.specialEvent === 'steal'

  let textColor = 'text-gray-400'
  if (isMy  && isScore)              textColor = 'text-orange-300'
  if (!isMy && isScore)              textColor = 'text-yellow-300'
  if ((isBlock || isSteal) && isMy)  textColor = 'text-red-400'
  if ((isBlock || isSteal) && !isMy) textColor = 'text-cyan-300'
  if (play.turnover && !isSteal)     textColor = 'text-gray-500'

  const dot = isMy
    ? <span className="text-orange-400 font-bold shrink-0">●</span>
    : <span className="text-yellow-400 font-bold shrink-0">○</span>

  return (
    <>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-200 ${isNew ? 'bg-white/5' : ''}`} style={{ fontSize: 13 }}>
        {/* Quarter + clock inline */}
        <div className="flex items-center gap-1 shrink-0" style={{ minWidth: 56 }}>
          <span className="text-gray-400" style={{ fontSize: 11 }}>{qLabel}</span>
          {clockStr && <span className="text-gray-400" style={{ fontSize: 10 }}>{clockStr}</span>}
        </div>
        {dot}
        <span className={`flex-1 ${textColor}`}>{desc}</span>
        <span className="text-gray-400 shrink-0" style={{ fontSize: 11 }}>({play.score[0]}–{play.score[1]})</span>
      </div>
      {zoneNotif && (
        <div className="px-4 pb-1" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
          color: play.zoneEntered === 'fire' || play.zoneEntered === 'hot' ? '#fb923c' : '#93c5fd' }}>
          {zoneNotif}
        </div>
      )}
    </>
  )
}

// ─── Box score table ──────────────────────────────────────────────────────────
function BoxScoreTable({ players, starterIds, boxEntries, label, lang }) {
  const didNotPlay = lang === 'zh' ? '未上场' : 'DNP'
  return (
    <div className="mb-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">{label}</div>
      <table className="w-full" style={{ fontSize: 12 }}>
        <thead>
          <tr className="text-gray-500 border-b border-gray-800">
            <th className="text-left px-2 py-1 font-medium">{t(T.boxScore.player, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-gray-500">{t(T.shared.min, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-orange-400">{t(T.shared.pts, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-blue-400">{t(T.shared.reb, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-green-400">{t(T.shared.ast, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-yellow-400">{t(T.shared.stl, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-purple-400">{t(T.shared.blk, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-red-400">{t(T.shared.to, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-pink-400">{t(T.shared.foul, lang)}</th>
            <th className="px-2 py-1 text-right font-medium">FG</th>
            <th className="px-2 py-1 text-right font-medium">3PT</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => {
            const isStarter = starterIds?.has(p.id) ?? true
            const b = boxEntries?.[p.id]
            const played = b && (b.pts > 0 || b.reb > 0 || b.fga > 0 || b.stl > 0 || b.blk > 0 || b.appearances > 0)
            return (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-white/3" style={{ opacity: (isStarter || played) ? 1 : 0.35 }}>
                <td className="px-2 py-1 text-white font-medium">
                  {lang === 'zh' ? getPlayerShortName(p, 'zh') : `${p.first_name?.[0] ?? ''}. ${p.last_name}`}
                  <span className="text-gray-400 ml-1">{p.playingAs ?? p.position}</span>
                  {!isStarter && played && <span className="text-gray-400 ml-1 text-xs">OUT</span>}
                  {!isStarter && !played && <span className="text-gray-700 ml-1 text-xs">DNP</span>}
                </td>
                {b ? (
                  <>
                    <td className="px-2 py-1 text-right text-gray-500">{b.min ?? 0}</td>
                    <td className="px-2 py-1 text-right text-orange-300 font-bold">{b.pts}</td>
                    <td className="px-2 py-1 text-right text-blue-300">{b.reb}</td>
                    <td className="px-2 py-1 text-right text-green-300">{b.ast}</td>
                    <td className="px-2 py-1 text-right text-yellow-300">{b.stl}</td>
                    <td className="px-2 py-1 text-right text-purple-300">{b.blk}</td>
                    <td className="px-2 py-1 text-right text-red-400">{b.to}</td>
                    <td className="px-2 py-1 text-right text-pink-300">{b.foul ?? 0}</td>
                    <td className="px-2 py-1 text-right text-gray-400">{b.fgm}/{b.fga}</td>
                    <td className="px-2 py-1 text-right text-gray-400">{b.fg3m}/{b.fg3a}</td>
                  </>
                ) : (
                  <td colSpan={10} className="px-2 py-1 text-right text-gray-700 text-xs">{didNotPlay}</td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Simulate() {
  const { team: roster, addCash } = useTeam()
  const { starters } = useStarters(roster)   // persisted lineup — only read, never written during sim
  const { lang } = useSettings()

  // During simulation, swaps are kept in local state so My Team lineup is never affected.
  // simStartersMap is null when not simulating; initialized from persisted starters on game start.
  const [simStartersMap, setSimStartersMap] = useState(null)
  const activeStarters = simStartersMap ?? starters

  const myStartersList = POS_ORDER
    .map(pos => activeStarters[pos] ? { ...activeStarters[pos], playingAs: pos } : null)
    .filter(Boolean)
  const hasFullLineup = myStartersList.length === 5

  const starterIds = Object.values(activeStarters).filter(Boolean).map(p => p.id)
  const bench = roster.filter(p => !starterIds.includes(p.id))

  const [gameResult, setGameResult]         = useState(null)
  const [revealed, setRevealed]             = useState(0)
  const [isAnimating, setIsAnimating]       = useState(false)
  const [speedIdx, setSpeedIdx]             = useState(0)
  const [tab, setTab]                       = useState('log')
  const [isPaused, setIsPaused]             = useState(false)
  const [pauseCountdown, setPauseCountdown] = useState(PAUSE_SECONDS)
  const [showLiveBoxScore, setShowLiveBoxScore] = useState(false)
  const [autoSim, setAutoSim]               = useState(false)
  // swapTarget: { player, rect, side }
  const [swapTarget, setSwapTarget]         = useState(null)

  const [rewardGranted, setRewardGranted] = useState(false)

  const logRef           = useRef(null)
  const intervalRef      = useRef(null)
  const pauseTimerRef    = useRef(null)
  const lastAutoSubRef   = useRef(null) // { playerId, revealedWhen } — prevent same-tick re-sub
  const benchedAtRef     = useRef({})  // { [playerId]: { revealedWhen, energyWhenBenched } }
  const rewardGivenRef   = useRef(false)
  const startersRef      = useRef(activeStarters)
  useEffect(() => { startersRef.current = activeStarters }, [activeStarters])
  // Hold gameResult in a ref so startInterval closure can access the latest value
  const gameResultRef = useRef(null)
  useEffect(() => { gameResultRef.current = gameResult }, [gameResult])

  // Final box score computed from ALL plays (handles subs correctly)
  const finalBoxScore = useMemo(() => {
    if (!gameResult?.plays) return null
    return computeFinalBoxScore(gameResult.plays)
  }, [gameResult])

  const speed = SPEEDS[speedIdx].ms

  // ── Derived state ───────────────────────────────────────────────────────
  const visiblePlays   = gameResult ? gameResult.plays.slice(0, revealed) : []
  const lastPlay       = visiblePlays[visiblePlays.length - 1] ?? null
  const currentScore   = lastPlay ? lastPlay.score : [0, 0]
  const currentQuarter = lastPlay ? lastPlay.quarter : 1
  const isDone         = gameResult != null && revealed >= gameResult.plays.length

  // Grant $5M reward once when player wins
  useEffect(() => {
    if (isDone && gameResult?.winner === 'my' && !rewardGivenRef.current) {
      rewardGivenRef.current = true
      addCash(5)
      setRewardGranted(true)
    }
  }, [isDone, gameResult?.winner])

  const liveMyEnergy  = lastPlay?.energySnapshot?.myTeam  ?? null
  const liveNpcEnergy = lastPlay?.energySnapshot?.npcTeam ?? null
  const qScores       = gameResult?.quarterScores ?? []

  const currentClockStr = useMemo(() => {
    if (!lastPlay || lastPlay.possIdx == null || isDone) return null
    const isOT = lastPlay.quarter > 4
    const totalSecs  = isOT ? 300 : 720
    const playsPerQ  = isOT ? 20 : 40
    const secPerPlay = totalSecs / playsPerQ
    const remaining  = Math.max(0, totalSecs - (lastPlay.possIdx + 1) * secPerPlay)
    const mm = Math.floor(remaining / 60)
    const ss = Math.round(remaining % 60)
    return `${mm}:${ss.toString().padStart(2, '0')}`
  }, [lastPlay, isDone])

  const currentNpcActive = useMemo(() => {
    let active = [...npcStarters]
    for (const play of visiblePlays) {
      if (play.isSub && play.teamIndex === 1) {
        active = active.map(p => p.id === play.subOut.id ? play.subIn : p)
      }
    }
    return active
  }, [visiblePlays])

  const usedNpcIds = new Set(currentNpcActive.map(p => p.id))
  const remainingNpcBench = npcBench.filter(p => !usedNpcIds.has(p.id))

  // Derive current zone state for each player from visible plays (in order).
  // Sub events clear the subbed-out player's zone so returning subs start fresh.
  const zoneMap = useMemo(() => {
    const map = {}
    for (const play of visiblePlays) {
      if (play.isSub) {
        if (play.subOut) map[play.subOut.id] = null
        continue
      }
      if (!play.attacker) continue
      map[play.attacker.id] = play.atkZone ?? null
    }
    return map
  }, [visiblePlays])

  // ── Animation interval ──────────────────────────────────────────────────
  function startInterval() {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setRevealed(r => {
        const result = gameResultRef.current
        const next = r + 1
        if (next >= result?.plays?.length) {
          clearInterval(intervalRef.current)
          setIsAnimating(false)
        }
        return next
      })
    }, speed)
  }

  useEffect(() => {
    if (!isAnimating || !gameResult || isPaused) return
    startInterval()
    return () => clearInterval(intervalRef.current)
  }, [isAnimating, gameResult, speed, isPaused])

  useEffect(() => {
    if (logRef.current && tab === 'log') {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [revealed, tab])

  // ── Auto-sim: continuously sub tired players, bench players recover energy ──
  const AUTO_SUB_THRESHOLD  = 38
  const BENCH_RECOVERY_RATE = 1.5 // energy % recovered per play while on bench

  useEffect(() => {
    if (!autoSim || !isAnimating || isPaused || isDone || !lastPlay) return
    const energies = liveMyEnergy ?? {}
    const currentStarters = startersRef.current

    for (const p of myStartersList) {
      // Don't re-sub the same player we just subbed within the last 8 plays
      // (prevents same-tick double-trigger before React re-renders the new lineup)
      if (lastAutoSubRef.current?.playerId === p.id &&
          revealed - lastAutoSubRef.current.revealedWhen < 8) continue

      const energy = energies[p.id] ?? 100
      if (energy >= AUTO_SUB_THRESHOLD) continue

      const pos = p.playingAs ?? p.position

      // Compute recovered energies for bench players
      const recoveredEnergies = { ...energies }
      for (const [id, info] of Object.entries(benchedAtRef.current)) {
        const playsOnBench = revealed - info.revealedWhen
        recoveredEnergies[id] = Math.min(100, info.energyWhenBenched + playsOnBench * BENCH_RECOVERY_RATE)
      }

      // Find best available bench player (by effective rating × energy × pos-match)
      const sorted = [...bench].sort((a, bPlayer) => {
        const pmA  = getPosMismatchMult(a.position, pos, a.positions)
        const pmB  = getPosMismatchMult(bPlayer.position, pos, bPlayer.positions)
        const eneA = getEnergyMultiplier(recoveredEnergies[a.id] ?? 100)
        const eneB = getEnergyMultiplier(recoveredEnergies[bPlayer.id] ?? 100)
        const effA = ((a.offenseRating ?? 0) + (a.defenseRating ?? 0)) * pmA * eneA
        const effB = ((bPlayer.offenseRating ?? 0) + (bPlayer.defenseRating ?? 0)) * pmB * eneB
        return effB - effA
      })
      const sub = sorted[0]
      if (!sub) continue

      // Record that p is going to bench
      benchedAtRef.current[p.id] = { revealedWhen: revealed, energyWhenBenched: energy }
      lastAutoSubRef.current = { playerId: p.id, revealedWhen: revealed }

      assignLocal(pos, sub)

      const manualList = POS_ORDER.map(slotPos => {
        if (slotPos === pos) return { ...sub, playingAs: slotPos }
        const existing = currentStarters[slotPos]
        if (!existing || existing.id === p.id || existing.id === sub.id) return null
        return { ...existing, playingAs: slotPos }
      }).filter(Boolean)

      const state = {
        score: lastPlay.score,
        quarter: lastPlay.quarter,
        myEnergies:  recoveredEnergies,
        npcEnergies: lastPlay.energySnapshot.npcTeam,
      }
      const newResult = resumeSimulation(visiblePlays, manualList, currentNpcActive, remainingNpcBench, state)
      setGameResult(newResult)
      break // one sub per tick; next tick handles any remaining tired players
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, autoSim])

  // ── Sim-local assign — updates simStartersMap only, never persisted starters ──
  function assignLocal(pos, player) {
    setSimStartersMap(prev => {
      const next = { ...(prev ?? starters) }
      for (const k of Object.keys(next)) {
        if (next[k]?.id === player.id) next[k] = null
      }
      next[pos] = player
      return next
    })
  }

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleSimulate() {
    if (!hasFullLineup) return
    clearInterval(intervalRef.current)
    clearInterval(pauseTimerRef.current)
    lastAutoSubRef.current = null
    benchedAtRef.current   = {}
    rewardGivenRef.current = false
    setRewardGranted(false)
    setSimStartersMap({ ...starters })   // snapshot persisted lineup for this game session
    const result = simulateGame(myStartersList, npcStarters, [...npcBench])
    setGameResult(result)
    setRevealed(0)
    setIsAnimating(true)
    setIsPaused(false)
    setShowLiveBoxScore(false)
    setTab('log')
    setSwapTarget(null)
  }

  function handleRestart() {
    clearInterval(intervalRef.current)
    clearInterval(pauseTimerRef.current)
    lastAutoSubRef.current = null
    benchedAtRef.current   = {}
    rewardGivenRef.current = false
    setRewardGranted(false)
    setSimStartersMap(null)   // release sim-local state; My Team lineup is unchanged
    setGameResult(null)
    setRevealed(0)
    setIsAnimating(false)
    setIsPaused(false)
    setShowLiveBoxScore(false)
    setSwapTarget(null)
  }

  function handlePause() {
    clearInterval(intervalRef.current)
    clearInterval(pauseTimerRef.current)
    setIsPaused(true)
    setShowLiveBoxScore(true)
    setPauseCountdown(PAUSE_SECONDS)
    let remaining = PAUSE_SECONDS
    pauseTimerRef.current = setInterval(() => {
      remaining -= 1
      setPauseCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(pauseTimerRef.current)
        setIsPaused(false)
        setShowLiveBoxScore(false)
        setSwapTarget(null)
      }
    }, 1000)
  }

  function handleResume() {
    clearInterval(pauseTimerRef.current)
    setIsPaused(false)
    setShowLiveBoxScore(false)
    setSwapTarget(null)
  }

  // Re-start animation when isPaused becomes false (mid-game)
  useEffect(() => {
    if (!isPaused && isAnimating && gameResult && !isDone) {
      startInterval()
    }
  }, [isPaused])

  // ── Card click → open swap panel ────────────────────────────────────────
  function handleCardClick(player, rect, side) {
    if (isAnimating && !isPaused) return
    setShowLiveBoxScore(false)
    setSwapTarget({ player, rect, side })
  }

  function handleSwap(newPlayer) {
    if (!swapTarget) return
    const pos           = swapTarget.player.playingAs ?? swapTarget.player.position
    const swappedOutPlayer = swapTarget.player
    setSwapTarget(null)

    // Compute recovered energies for bench players before applying the swap
    const recoveredEnergies = { ...(lastPlay?.energySnapshot?.myTeam ?? {}) }
    for (const [id, info] of Object.entries(benchedAtRef.current)) {
      const playsOnBench = revealed - info.revealedWhen
      recoveredEnergies[id] = Math.min(100, info.energyWhenBenched + playsOnBench * BENCH_RECOVERY_RATE)
    }

    // Record the player being sent to bench
    if (lastPlay) {
      const theirEnergy = recoveredEnergies[swappedOutPlayer.id] ?? 100
      benchedAtRef.current[swappedOutPlayer.id] = { revealedWhen: revealed, energyWhenBenched: theirEnergy }
    }

    assignLocal(pos, newPlayer)

    if (gameResult && lastPlay) {
      const manualList = POS_ORDER.map(p => {
        if (p === pos) return { ...newPlayer, playingAs: pos }
        const existing = activeStarters[p]
        if (!existing || existing.id === swappedOutPlayer.id || existing.id === newPlayer.id) return null
        return { ...existing, playingAs: p }
      }).filter(Boolean)

      const state = {
        score: lastPlay.score,
        quarter: lastPlay.quarter,
        myEnergies:  recoveredEnergies,
        npcEnergies: lastPlay.energySnapshot.npcTeam,
      }
      const newResult = resumeSimulation(visiblePlays, manualList, currentNpcActive, remainingNpcBench, state)
      setGameResult(newResult)
    }
  }

  // ── Incomplete lineup ───────────────────────────────────────────────────
  if (!hasFullLineup) {
    return (
      <div className="h-full flex items-center justify-center text-center"
        style={{ background: 'var(--gradient-simulate)' }}>
        <div>
          <div className="text-5xl mb-4">🏀</div>
          <div className="text-white text-xl font-bold mb-2">{t(T.simulate.incompleteTitle, lang)}</div>
          <div className="text-gray-400 mb-1">{t(T.simulate.incompleteHave, lang, myStartersList.length)}</div>
          <div className="text-gray-500 text-sm">{t(T.simulate.incompleteHint, lang)}</div>
        </div>
      </div>
    )
  }

  const canSwap = !isAnimating || isPaused

  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--gradient-simulate)', color: 'var(--text-primary)' }}>

      {/* ── Score bar ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 px-4 py-2 border-b border-gray-800/60"
        style={{ background: 'var(--bg-overlay-mid)', backdropFilter: 'blur(8px)' }}>

        <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
          {/* My team logo placeholder — basketball emoji styled as badge */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ea580c, #b45309)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 2,
            boxShadow: isDone && gameResult?.winner === 'my' ? '0 0 14px 4px rgba(251,146,60,0.7)' : '0 2px 8px rgba(0,0,0,0.5)',
          }}>🏀</div>
          <div className="text-orange-400 font-bold tracking-wide" style={{ fontSize: 9 }}>
            {t(T.simulate.myTeamLabel, lang)}
          </div>
          <div className="font-black tabular-nums leading-none"
            style={{ fontSize: 44, color: isDone && gameResult.winner === 'my' ? '#fb923c' : 'var(--text-primary)' }}>
            {currentScore[0]}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-gray-500 text-xs">
            {!gameResult ? t(T.simulate.vs, lang) : isDone ? t(T.simulate.final, lang) : (() => {
              if (currentQuarter <= 4) return `Q${currentQuarter}`
              const n = currentQuarter - 4; return n === 1 ? 'OT' : `${n}OT`
            })()}
          </div>
          {currentClockStr && (
            <div className="font-mono font-black tabular-nums leading-none"
              style={{ fontSize: 26, color: '#f1f5f9', letterSpacing: '0.02em' }}>
              {currentClockStr}
            </div>
          )}
          {gameResult && (() => {
            // Only show completed quarters; derive current-quarter running score from cumulative total
            const completedQCount = isDone ? qScores.length : Math.max(0, currentQuarter - 1)
            const completedQScores = qScores.slice(0, completedQCount)
            const sumMy  = completedQScores.reduce((s, [m]) => s + m, 0)
            const sumNpc = completedQScores.reduce((s, [, n]) => s + n, 0)
            const curQMy  = currentScore[0] - sumMy
            const curQNpc = currentScore[1] - sumNpc
            return (
              <div className="flex gap-1" style={{ fontSize: 10 }}>
                {/* Completed quarters */}
                {completedQScores.map(([m, n], i) => (
                  <div key={i} className="flex flex-col items-center px-1.5 py-0.5 bg-gray-800/70 rounded">
                    <span className="text-gray-500">{i < 4 ? `Q${i + 1}` : i === 4 ? 'OT' : `${i - 3}OT`}</span>
                    <span className="text-orange-300 font-bold">{m}</span>
                    <span className="text-yellow-300 font-bold">{n}</span>
                  </div>
                ))}
                {/* Current quarter live score */}
                {!isDone && (
                  <div className="flex flex-col items-center px-1.5 py-0.5 bg-gray-800/40 border border-gray-700/40 rounded">
                    <span className="text-orange-600 font-bold" style={{ fontSize: 8 }}>{(() => { if (currentQuarter <= 4) return `Q${currentQuarter}`; const n = currentQuarter - 4; return n === 1 ? 'OT' : `${n}OT` })()}▶</span>
                    <span className="text-orange-300 font-bold">{curQMy}</span>
                    <span className="text-yellow-300 font-bold">{curQNpc}</span>
                  </div>
                )}
                {/* Future quarters */}
                {Array.from({ length: isDone ? 0 : 3 - completedQCount }).map((_, i) => (
                  <div key={`e${i}`} className="flex flex-col items-center px-1.5 py-0.5 bg-gray-800/30 rounded">
                    <span className="text-gray-700">Q{completedQCount + i + 2}</span>
                    <span className="text-gray-700">—</span>
                    <span className="text-gray-700">—</span>
                  </div>
                ))}
              </div>
            )
          })()}
          {isDone && (
            <div className="font-bold px-2 py-0.5 rounded text-xs bg-gray-800 text-blue-400">
              {gameResult.winner === 'my' ? t(T.simulate.youWin, lang)
                : gameResult.winner === 'npc' ? t(T.simulate.dynastyWins, lang)
                : t(T.simulate.tie, lang)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
          {/* NPC team logo */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#1e293b', border: '1px solid #374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', marginBottom: 2,
            boxShadow: isDone && gameResult?.winner === 'npc' ? '0 0 14px 4px rgba(250,204,21,0.7)' : '0 2px 8px rgba(0,0,0,0.5)',
          }}>
            <img src={NPC_TEAM_LOGO} alt="GSW" style={{ width: 38, height: 38, objectFit: 'contain' }} />
          </div>
          <div className="text-yellow-400 font-bold tracking-wide" style={{ fontSize: 9 }}>{NPC_TEAM_SHORT}</div>
          <div className="font-black tabular-nums leading-none"
            style={{ fontSize: 44, color: isDone && gameResult.winner === 'npc' ? '#facc15' : 'var(--text-primary)' }}>
            {currentScore[1]}
          </div>
        </div>
      </div>

      {/* ── 3-column body ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Left: My team */}
        <TeamColumn
          label={t(T.simulate.myTeamLabel, lang)}
          players={myStartersList}
          energies={liveMyEnergy}
          zones={zoneMap}
          side="left"
          canSwap={canSwap}
          onCardClick={handleCardClick}
          lang={lang}
        />

        {/* Center: controls + content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Controls */}
          <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-800/40">
            {!gameResult && (
              <>
                <button onClick={handleSimulate}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg text-sm transition-colors">
                  {t(T.simulate.simulateBtn, lang)}
                </button>
                <button
                  onClick={() => setAutoSim(v => !v)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${autoSim ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                  title={autoSim ? t(T.simulate.autoSimulate, lang) : t(T.simulate.autoSimulateOff, lang)}
                >
                  {autoSim ? t(T.simulate.autoSimulate, lang) : t(T.simulate.autoSimulateOff, lang)}
                </button>
              </>
            )}

            {gameResult && !isDone && (
              <>
                <div className="flex items-center gap-1">
                  {SPEEDS.map((s, i) => (
                    <button key={s.labelKey} onClick={() => setSpeedIdx(i)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${speedIdx === i ? 'bg-orange-500 text-black font-bold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {t(T.simulate[s.labelKey], lang)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAutoSim(v => !v)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${autoSim ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                >
                  {autoSim ? t(T.simulate.autoSimulate, lang) : t(T.simulate.autoSimulateOff, lang)}
                </button>

                {!isPaused ? (
                  <button onClick={handlePause}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-semibold transition-colors">
                    ⏸ {t(T.simulate.pause, lang)}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={handleResume}
                      className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-semibold transition-colors">
                      ▶ {t(T.simulate.resume, lang)}
                    </button>
                    <span className="text-yellow-400 text-xs">
                      {t(T.simulate.autoResume, lang, pauseCountdown)}
                    </span>
                    <button
                      onClick={() => setShowLiveBoxScore(v => !v)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${showLiveBoxScore ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                      {t(T.simulate.statsBtn, lang)}
                    </button>
                    <span className="text-gray-600 text-xs">
                      {t(T.simulate.clickToSub, lang)}
                    </span>
                  </div>
                )}
              </>
            )}

            {isDone && (
              <>
                <button onClick={() => setTab('log')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${tab === 'log' ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  {t(T.simulate.playLog, lang)}
                </button>
                <button onClick={() => setTab('box')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${tab === 'box' ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  {t(T.simulate.boxScore, lang)}
                </button>
                <button onClick={handleRestart}
                  className="ml-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors">
                  {t(T.simulate.newGame, lang)}
                </button>
                {rewardGranted && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}>
                    {t(T.simulate.winReward, lang)}
                  </div>
                )}
              </>
            )}

            <div className="ml-auto text-gray-600 text-xs">
              {gameResult
                ? t(T.simulate.playsCount, lang, revealed, gameResult.plays.length)
                : t(T.simulate.vsLabel, lang, NPC_TEAM_NAME)}
            </div>
          </div>

          {/* Play log / box score */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {tab === 'log' && (
              <div ref={logRef} className="h-full overflow-y-auto py-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
                {visiblePlays.length === 0 && (
                  <div className="text-center text-gray-600 mt-12 text-sm">
                    {t(T.simulate.pressStart, lang)}
                  </div>
                )}
                {visiblePlays.map((play, i) => (
                  <PlayRow key={i} play={play} isNew={i === visiblePlays.length - 1 && isAnimating} lang={lang} />
                ))}
                {isDone && (
                  <div className="text-center text-gray-600 py-4 text-xs">{t(T.simulate.endOfGame, lang)}</div>
                )}
              </div>
            )}

            {tab === 'box' && isDone && finalBoxScore && (
              <div className="h-full overflow-y-auto py-2 px-2">
                <BoxScoreTable
                  players={[...myStartersList, ...bench]}
                  starterIds={new Set(myStartersList.map(p => p.id))}
                  boxEntries={finalBoxScore.myTeam}
                  label={t(T.simulate.myTeamLabel, lang)}
                  lang={lang}
                />
                <BoxScoreTable
                  players={[...npcStarters, ...npcBench]}
                  starterIds={new Set(npcStarters.map(p => p.id))}
                  boxEntries={finalBoxScore.npcTeam}
                  label={NPC_TEAM_SHORT}
                  lang={lang}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: NPC team */}
        <TeamColumn
          label={NPC_TEAM_SHORT}
          players={currentNpcActive}
          energies={liveNpcEnergy}
          zones={zoneMap}
          side="right"
          canSwap={false}
          onCardClick={null}
          lang={lang}
        />
      </div>

      {/* Bench swap panel — portal, fixed next to clicked card */}
      <BenchSwapPanel
        swapTarget={swapTarget}
        bench={bench}
        onSwap={handleSwap}
        onClose={() => setSwapTarget(null)}
        lang={lang}
      />

      {/* Live box score float — shown when paused mid-game */}
      {isPaused && visiblePlays.length > 0 && showLiveBoxScore && (
        <LiveBoxScoreFloat
          myStartersList={myStartersList}
          currentNpcActive={currentNpcActive}
          visiblePlays={visiblePlays}
          onClose={() => setShowLiveBoxScore(false)}
          lang={lang}
        />
      )}
    </div>
  )
}
