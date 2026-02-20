import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTeam } from '../hooks/useTeam'
import { useStarters, POS_ORDER } from '../hooks/useStarters'
import { simulateGame, resumeSimulation, getEnergyMultiplier, getPosMismatchMult } from '../utils/gameEngine'
import { npcStarters, npcBench, NPC_TEAM_NAME, NPC_TEAM_SHORT } from '../data/npcTeam'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getPlayerShortName, getPlayerName } from '../data/playerNames'

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

function getTierBorder(tierName) {
  if (!tierName) return '#374151'
  if (['S+', 'S', 'S-'].includes(tierName)) return '#a855f7'
  if (['A+', 'A', 'A-'].includes(tierName)) return '#60a5fa'
  if (['B+', 'B', 'B-'].includes(tierName)) return '#22d3ee'
  if (['C+', 'C', 'C-'].includes(tierName)) return '#4ade80'
  return '#6b7280'
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

// ─── Bigger vertical player card ──────────────────────────────────────────────
function PlayerCardV({ player, energyPct, side, onClick, showSwapHint, lang }) {
  const [hoverRect, setHoverRect] = useState(null)
  const cardRef = useRef(null)
  const tierName    = player?.tier?.name
  const borderColor = getTierBorder(tierName)
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
        <div
          style={{
            width: 'clamp(80px, 9vw, 110px)',
            height: 'clamp(90px, 10vw, 120px)',
            border: `2px solid ${mismatchSevere ? '#ef4444' : hasMismatch ? '#f59e0b' : borderColor}`,
            borderRadius: 10,
            overflow: 'hidden',
            background: '#0f172a',
            position: 'relative',
            boxShadow: mismatchSevere
              ? `0 0 18px 4px rgba(239,68,68,0.4), 0 4px 16px rgba(0,0,0,0.7)`
              : `0 0 16px 3px ${borderColor}55, 0 4px 16px rgba(0,0,0,0.7)`,
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

// ─── Live box score from visible plays ───────────────────────────────────────
function computeLiveBoxScore(plays) {
  const boxes = {}
  function box(id) {
    if (!boxes[id]) boxes[id] = { pts: 0, to: 0, stl: 0, blk: 0, fga: 0, fgm: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0, player: null }
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
    if (def) {
      const b = box(def.id)
      b.player = def
      if (play.specialEvent === 'steal') b.stl++
      if (play.specialEvent === 'block') b.blk++
    }
  }
  return boxes
}

// ─── Paused live box score overlay ────────────────────────────────────────────
function LiveBoxScoreFloat({ myStartersList, currentNpcActive, visiblePlays, onClose, lang }) {
  const boxes = useMemo(() => computeLiveBoxScore(visiblePlays), [visiblePlays])

  const myLabel  = lang === 'zh' ? '我的球队' : 'My Team'
  const npcLabel = lang === 'zh' ? '勇士王朝' : 'GSW Dynasty'
  const hdrs     = lang === 'zh'
    ? ['球员', '分', '出手', '三分', '抢断', '盖帽', '失误']
    : ['Player', 'PTS', 'FG', '3PT', 'STL', 'BLK', 'TO']

  function rows(players) {
    return players.map(p => {
      const b = boxes[p.id]
      return (
        <tr key={p.id} className="border-b border-gray-800/40">
          <td className="px-2 py-1 text-white font-medium text-xs whitespace-nowrap">
            {lang === 'zh' ? getPlayerShortName(p, 'zh') : p.last_name}
            <span className="text-gray-600 ml-1 text-xs">{p.playingAs ?? p.position}</span>
          </td>
          <td className="px-2 py-1 text-right text-orange-300 font-bold text-xs">{b?.pts ?? 0}</td>
          <td className="px-2 py-1 text-right text-gray-400 text-xs">{b?.fgm ?? 0}/{b?.fga ?? 0}</td>
          <td className="px-2 py-1 text-right text-gray-400 text-xs">{b?.fg3m ?? 0}/{b?.fg3a ?? 0}</td>
          <td className="px-2 py-1 text-right text-yellow-300 text-xs">{b?.stl ?? 0}</td>
          <td className="px-2 py-1 text-right text-purple-300 text-xs">{b?.blk ?? 0}</td>
          <td className="px-2 py-1 text-right text-red-400 text-xs">{b?.to ?? 0}</td>
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
          {lang === 'zh' ? '当前数据统计' : 'Live Box Score'}
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
              {lang === 'zh' ? '换人' : 'Sub player'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg px-1">✕</button>
        </div>

        {/* Current player */}
        <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/60">
          <div className="text-gray-600 text-xs mb-0.5 uppercase tracking-wide">
            {lang === 'zh' ? '当前球员' : 'Current'}
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
              ? (lang === 'zh' ? '无替补' : 'No bench players')
              : (lang === 'zh' ? '选择替补' : 'Select replacement')}
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
                        {lang === 'zh' ? '进' : 'ATK'} <span className="font-bold">{effAtk}</span>
                        {pen > 0 && <span className="text-gray-600 ml-0.5">({p.offenseRating})</span>}
                      </span>
                      <span className="text-blue-400">
                        {lang === 'zh' ? '防' : 'DEF'} <span className="font-bold">{effDef}</span>
                        {pen > 0 && <span className="text-gray-600 ml-0.5">({p.defenseRating})</span>}
                      </span>
                      <span className="text-gray-600">{(p.positions ?? [p.position]).join('/')}</span>
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
function TeamColumn({ label, players, energies, side, canSwap, onCardClick, lang }) {
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

  if (play.isSub) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1 ${isNew ? 'bg-white/5' : ''}`} style={{ fontSize: 13 }}>
        <span className="text-gray-600 w-6 shrink-0" style={{ fontSize: 11 }}>Q{play.quarter}</span>
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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-200 ${isNew ? 'bg-white/5' : ''}`} style={{ fontSize: 13 }}>
      <span className="text-gray-600 w-6 shrink-0" style={{ fontSize: 11 }}>Q{play.quarter}</span>
      {dot}
      <span className={`flex-1 ${textColor}`}>{desc}</span>
      <span className="text-gray-600 shrink-0" style={{ fontSize: 11 }}>({play.score[0]}–{play.score[1]})</span>
    </div>
  )
}

// ─── Box score table ──────────────────────────────────────────────────────────
function BoxScoreTable({ players, boxEntries, label, lang }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">{label}</div>
      <table className="w-full" style={{ fontSize: 12 }}>
        <thead>
          <tr className="text-gray-500 border-b border-gray-800">
            <th className="text-left px-2 py-1 font-medium">{t(T.boxScore.player, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-orange-400">{t(T.shared.pts, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-blue-400">{t(T.shared.reb, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-green-400">{t(T.shared.ast, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-yellow-400">{t(T.shared.stl, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-purple-400">{t(T.shared.blk, lang)}</th>
            <th className="px-2 py-1 text-right font-medium text-red-400">{t(T.shared.to, lang)}</th>
            <th className="px-2 py-1 text-right font-medium">FG</th>
            <th className="px-2 py-1 text-right font-medium">3PT</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => {
            const b = boxEntries?.[p.id]
            if (!b) return null
            const played = b.pts > 0 || b.reb > 0 || b.ast > 0 || b.fga > 0 || b.stl > 0 || b.blk > 0
            return (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-white/3" style={{ opacity: played ? 1 : 0.4 }}>
                <td className="px-2 py-1 text-white font-medium">
                  {lang === 'zh' ? getPlayerShortName(p, 'zh') : `${p.first_name?.[0] ?? ''}. ${p.last_name}`}
                  <span className="text-gray-600 ml-1">{p.position}</span>
                </td>
                <td className="px-2 py-1 text-right text-orange-300 font-bold">{b.pts}</td>
                <td className="px-2 py-1 text-right text-blue-300">{b.reb}</td>
                <td className="px-2 py-1 text-right text-green-300">{b.ast}</td>
                <td className="px-2 py-1 text-right text-yellow-300">{b.stl}</td>
                <td className="px-2 py-1 text-right text-purple-300">{b.blk}</td>
                <td className="px-2 py-1 text-right text-red-400">{b.to}</td>
                <td className="px-2 py-1 text-right text-gray-400">{b.fgm}/{b.fga}</td>
                <td className="px-2 py-1 text-right text-gray-400">{b.fg3m}/{b.fg3a}</td>
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
  const { team: roster } = useTeam()
  const { starters, assign } = useStarters(roster)
  const { lang } = useSettings()

  const myStartersList = POS_ORDER
    .map(pos => starters[pos] ? { ...starters[pos], playingAs: pos } : null)
    .filter(Boolean)
  const hasFullLineup = myStartersList.length === 5

  const starterIds = Object.values(starters).filter(Boolean).map(p => p.id)
  const bench = roster.filter(p => !starterIds.includes(p.id))

  const [gameResult, setGameResult]         = useState(null)
  const [revealed, setRevealed]             = useState(0)
  const [isAnimating, setIsAnimating]       = useState(false)
  const [speedIdx, setSpeedIdx]             = useState(0)
  const [tab, setTab]                       = useState('log')
  const [isPaused, setIsPaused]             = useState(false)
  const [pauseCountdown, setPauseCountdown] = useState(PAUSE_SECONDS)
  const [showLiveBoxScore, setShowLiveBoxScore] = useState(false)
  // swapTarget: { player, rect, side }
  const [swapTarget, setSwapTarget]         = useState(null)

  const logRef        = useRef(null)
  const intervalRef   = useRef(null)
  const pauseTimerRef = useRef(null)
  // Hold gameResult in a ref so startInterval closure can access the latest value
  const gameResultRef = useRef(null)
  useEffect(() => { gameResultRef.current = gameResult }, [gameResult])

  const speed = SPEEDS[speedIdx].ms

  // ── Derived state ───────────────────────────────────────────────────────
  const visiblePlays   = gameResult ? gameResult.plays.slice(0, revealed) : []
  const lastPlay       = visiblePlays[visiblePlays.length - 1] ?? null
  const currentScore   = lastPlay ? lastPlay.score : [0, 0]
  const currentQuarter = lastPlay ? lastPlay.quarter : 1
  const isDone         = gameResult != null && revealed >= gameResult.plays.length

  const liveMyEnergy  = lastPlay?.energySnapshot?.myTeam  ?? null
  const liveNpcEnergy = lastPlay?.energySnapshot?.npcTeam ?? null
  const qScores       = gameResult?.quarterScores ?? []

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

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleSimulate() {
    if (!hasFullLineup) return
    clearInterval(intervalRef.current)
    clearInterval(pauseTimerRef.current)
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
    const pos = swapTarget.player.playingAs ?? swapTarget.player.position
    assign(pos, newPlayer)
    setSwapTarget(null)

    if (gameResult && lastPlay) {
      // Build updated lineup manually (assign() is async state update)
      const manualList = POS_ORDER.map(p => {
        if (p === pos) return { ...newPlayer, playingAs: pos }
        const existing = starters[p]
        if (!existing || existing.id === swapTarget.player.id || existing.id === newPlayer.id) return null
        return { ...existing, playingAs: p }
      }).filter(Boolean)

      const state = {
        score: lastPlay.score,
        quarter: lastPlay.quarter,
        myEnergies:  lastPlay.energySnapshot.myTeam,
        npcEnergies: lastPlay.energySnapshot.npcTeam,
      }
      const newResult = resumeSimulation(visiblePlays, manualList, currentNpcActive, remainingNpcBench, state)
      setGameResult(newResult)
      // Stay paused — countdown continues; user resumes manually or timer expires
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
            {!gameResult ? t(T.simulate.vs, lang) : isDone ? t(T.simulate.final, lang) : `Q${currentQuarter}`}
          </div>
          {gameResult && (
            <div className="flex gap-1" style={{ fontSize: 10 }}>
              {qScores.map(([m, n], i) => (
                <div key={i} className="flex flex-col items-center px-1.5 py-0.5 bg-gray-800/70 rounded">
                  <span className="text-gray-500">Q{i + 1}</span>
                  <span className="text-orange-300 font-bold">{m}</span>
                  <span className="text-yellow-300 font-bold">{n}</span>
                </div>
              ))}
              {Array.from({ length: 4 - qScores.length }).map((_, i) => (
                <div key={`e${i}`} className="flex flex-col items-center px-1.5 py-0.5 bg-gray-800/30 rounded">
                  <span className="text-gray-700">Q{qScores.length + i + 1}</span>
                  <span className="text-gray-700">—</span>
                  <span className="text-gray-700">—</span>
                </div>
              ))}
            </div>
          )}
          {isDone && (
            <div className="font-bold px-2 py-0.5 rounded text-xs bg-gray-800 text-blue-400">
              {gameResult.winner === 'my' ? t(T.simulate.youWin, lang)
                : gameResult.winner === 'npc' ? t(T.simulate.dynastyWins, lang)
                : t(T.simulate.tie, lang)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
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
              <button onClick={handleSimulate}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg text-sm transition-colors">
                {t(T.simulate.simulateBtn, lang)}
              </button>
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

                {!isPaused ? (
                  <button onClick={handlePause}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-semibold transition-colors">
                    ⏸ {lang === 'zh' ? '暂停' : 'Pause'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={handleResume}
                      className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-semibold transition-colors">
                      ▶ {lang === 'zh' ? '继续' : 'Resume'}
                    </button>
                    <span className="text-yellow-400 text-xs">
                      {lang === 'zh' ? `${pauseCountdown}秒后自动继续` : `Auto in ${pauseCountdown}s`}
                    </span>
                    <button
                    onClick={() => setShowLiveBoxScore(v => !v)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${showLiveBoxScore ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  >
                    {lang === 'zh' ? '数据' : 'Stats'}
                  </button>
                  <span className="text-gray-600 text-xs">
                    {lang === 'zh' ? '— 点击球员换人' : '— click a player to sub'}
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

            {tab === 'box' && isDone && (
              <div className="h-full overflow-y-auto py-2 px-2">
                <BoxScoreTable players={myStartersList} boxEntries={gameResult.boxScore.myTeam} label={t(T.simulate.myTeamLabel, lang)} lang={lang} />
                <BoxScoreTable players={[...npcStarters, ...npcBench]} boxEntries={gameResult.boxScore.npcTeam} label={NPC_TEAM_SHORT} lang={lang} />
              </div>
            )}
          </div>
        </div>

        {/* Right: NPC team */}
        <TeamColumn
          label={NPC_TEAM_SHORT}
          players={currentNpcActive}
          energies={liveNpcEnergy}
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
