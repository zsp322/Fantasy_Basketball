import { useState, useEffect } from 'react'
import { useMarket } from '../hooks/useMarket'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getPlayerName } from '../data/playerNames'

function formatCountdown(ms, lang = 'en') {
  if (ms <= 0) return lang === 'zh' ? '刷新中...' : 'Refreshing...'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (lang === 'zh') {
    if (h > 0) return `${h}小时${m}分`
    return `${m}分${s}秒`
  }
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

function getTierBorderColor(tierName) {
  if (!tierName) return 'rgba(75,85,99,0.8)'
  if (['S+', 'S', 'S-'].includes(tierName)) return 'rgba(168,85,247,0.9)'
  if (['A+', 'A', 'A-'].includes(tierName)) return 'rgba(96,165,250,0.9)'
  if (['B+', 'B', 'B-'].includes(tierName)) return 'rgba(34,211,238,0.9)'
  if (['C+', 'C', 'C-'].includes(tierName)) return 'rgba(74,222,128,0.9)'
  return 'rgba(156,163,175,0.6)'
}

function getTierGlow(tierName) {
  if (!tierName) return 'transparent'
  if (['S+', 'S', 'S-'].includes(tierName)) return 'rgba(168,85,247,0.5)'
  if (['A+', 'A', 'A-'].includes(tierName)) return 'rgba(96,165,250,0.45)'
  if (['B+', 'B', 'B-'].includes(tierName)) return 'rgba(34,211,238,0.4)'
  if (['C+', 'C', 'C-'].includes(tierName)) return 'rgba(74,222,128,0.4)'
  return 'rgba(156,163,175,0.2)'
}

// ── Radar chart ──────────────────────────────────────────────
const RADAR_AXES = [
  { key: 'pts', label: 'PTS', max: 35 },
  { key: 'ast', label: 'AST', max: 12 },
  { key: 'blk', label: 'BLK', max: 3.5 },
  { key: 'stl', label: 'STL', max: 3 },
  { key: 'reb', label: 'REB', max: 15 },
]

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function RadarChart({ avg }) {
  if (!avg) return null
  const SIZE = 130, cx = 65, cy = 65, R = 42
  const n = RADAR_AXES.length
  const angles = RADAR_AXES.map((_, i) => -90 + (i * 360) / n)

  const gridPts = (lv) => angles.map(a => { const p = polar(cx, cy, R * lv, a); return `${p.x},${p.y}` }).join(' ')
  const dataPts = RADAR_AXES.map((ax, i) => {
    const v = Math.min(Math.max((avg[ax.key] ?? 0) / ax.max, 0), 1)
    const p = polar(cx, cy, R * v, angles[i])
    return `${p.x},${p.y}`
  })
  const labels = RADAR_AXES.map((ax, i) => {
    const p = polar(cx, cy, R * 1.38, angles[i])
    return { ...p, label: ax.label, val: (avg[ax.key] ?? 0).toFixed(1) }
  })

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {[0.25, 0.5, 0.75, 1].map((lv, i) => (
        <polygon key={i} points={gridPts(lv)} fill="none"
          stroke={lv === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.8" />
      ))}
      {angles.map((a, i) => {
        const p = polar(cx, cy, R, a)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
      })}
      <polygon points={dataPts.join(' ')} fill="rgba(251,146,60,0.28)"
        stroke="rgba(251,146,60,0.9)" strokeWidth="1.5" strokeLinejoin="round" />
      {dataPts.map((pt, i) => {
        const [x, y] = pt.split(',').map(Number)
        return <circle key={i} cx={x} cy={y} r="2.2" fill="rgb(251,146,60)" />
      })}
      {labels.map((lp, i) => (
        <g key={i}>
          <text x={lp.x} y={lp.y - 3} textAnchor="middle" fill="rgba(200,200,200,0.8)" fontSize="7.5" fontWeight="600">{lp.label}</text>
          <text x={lp.x} y={lp.y + 6.5} textAnchor="middle" fill="rgba(251,146,60,0.9)" fontSize="7">{lp.val}</text>
        </g>
      ))}
    </svg>
  )
}

// ── Bottom stats panel ────────────────────────────────────────
function StatsPanel({ player, onClose, lang = 'zh' }) {
  if (!player) return null
  const avg = player.avg
  const stat = v => (v != null ? Number(v).toFixed(1) : '—')
  const tierName = player.tier?.name
  const maxMap = { PTS: 35, REB: 15, AST: 12, STL: 3, BLK: 3.5, TO: 5 }
  const rows = [
    { label: 'PTS', value: stat(avg?.pts), color: '#fb923c' },
    { label: 'REB', value: stat(avg?.reb), color: '#60a5fa' },
    { label: 'AST', value: stat(avg?.ast), color: '#4ade80' },
    { label: 'STL', value: stat(avg?.stl), color: '#facc15' },
    { label: 'BLK', value: stat(avg?.blk), color: '#c084fc' },
    { label: 'TO',  value: stat(avg?.to),  color: '#f87171' },
  ]

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30"
      style={{
        background: 'linear-gradient(to top, rgba(5,4,15,0.98) 0%, rgba(8,6,20,0.95) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-stretch gap-0 px-6 py-3">

        {/* Player photo + name */}
        <div className="flex items-center gap-3 pr-6 border-r border-gray-700/50 shrink-0">
          {player.headshot ? (
            <img src={player.headshot} alt={player.last_name}
              className="rounded-lg object-cover object-top"
              style={{ width: 52, height: 60 }} />
          ) : (
            <div className="rounded-lg bg-gray-800 flex items-center justify-center text-white font-bold"
              style={{ width: 52, height: 60 }}>
              {player.first_name?.[0]}{player.last_name?.[0]}
            </div>
          )}
          <div>
            <div className="text-white font-bold text-sm">{getPlayerName(player, lang)}</div>
            <div className="text-gray-400 text-xs mt-0.5">{avg?.teamAbbr ?? '—'} · {player.position || '—'}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${player.tier?.color ?? 'bg-gray-500 text-white'}`}>
                {tierName}
              </span>
              <span className="text-green-400 text-xs font-bold">${player.tier?.salary}M</span>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="flex items-center justify-center px-4 border-r border-gray-700/50 shrink-0">
          <RadarChart avg={avg} />
        </div>

        {/* Stat bars */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 px-6">
          {rows.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-7">{label}</span>
              <div className="flex-1 bg-gray-800/80 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((Number(value) / (maxMap[label] ?? 10)) * 100, 100)}%`,
                    background: color,
                  }} />
              </div>
              <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ATK / DEF ratings */}
        <div className="flex flex-col justify-center gap-4 pl-6 border-l border-gray-700/50 shrink-0 w-36">
          {[
            { label: 'ATK', value: player.offenseRating ?? 0, color: '#fb923c', max: 100 },
            { label: 'DEF', value: player.defenseRating ?? 0, color: '#60a5fa', max: 100 },
          ].map(({ label, value, color, max }) => (
            <div key={label}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
                <span className="font-bold text-xl leading-none" style={{ color }}>{value}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="self-start ml-4 mt-1 text-gray-600 hover:text-white transition-colors text-lg leading-none">
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Player card ───────────────────────────────────────────────
function PlayerMarketCard({ player, onBuy, canAfford, alreadyOwned, selected, onSelect, lang = 'zh' }) {
  const [feedback, setFeedback] = useState(null)
  const [hovered, setHovered] = useState(false)
  const tierName = player.tier?.name
  const borderColor = getTierBorderColor(tierName)
  const glow = getTierGlow(tierName)

  function handleBuy(e) {
    e.stopPropagation()
    const result = onBuy(player)
    if (result.ok) {
      setFeedback({ type: 'ok', msg: t(T.market.signingOk, lang) })
    } else {
      setFeedback({ type: 'err', msg: result.reason })
      setTimeout(() => setFeedback(null), 2500)
    }
  }

  return (
    <div
      className="flex flex-col items-center cursor-pointer"
      onClick={() => onSelect(player)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo card */}
      <div
        style={{
          width: 'clamp(140px, 14vw, 190px)',
          height: 'clamp(178px, 18vw, 242px)',
          border: `2px solid ${selected ? '#f97316' : borderColor}`,
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: selected
            ? '0 0 32px 8px rgba(249,115,22,0.5), 0 6px 24px rgba(0,0,0,0.9)'
            : alreadyOwned
              ? 'none'
              : hovered
                ? `0 0 36px 8px ${glow}, 0 8px 28px rgba(0,0,0,0.9)`
                : `0 0 20px 3px ${glow}, 0 4px 16px rgba(0,0,0,0.8)`,
          opacity: alreadyOwned ? 0.45 : 1,
          transform: (hovered || selected) && !alreadyOwned ? 'scale(1.04) translateY(-4px)' : 'scale(1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {player.headshot ? (
          <img src={player.headshot} alt={player.last_name}
            className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white font-bold text-3xl">
            {player.first_name?.[0]}{player.last_name?.[0]}
          </div>
        )}

        {/* Tier badge */}
        <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded font-bold ${player.tier?.color ?? 'bg-gray-500 text-white'}`}
          style={{ fontSize: '0.6rem' }}>
          {tierName}
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />
        )}

        {/* Already owned overlay */}
        {alreadyOwned && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-green-400 font-bold text-sm border border-green-500 px-3 py-1 rounded-lg">
              {t(T.market.onTeam, lang)}
            </span>
          </div>
        )}
      </div>

      {/* Info below */}
      <div className="mt-2.5 text-center" style={{ width: 'clamp(140px, 14vw, 190px)' }}>
        <div className="text-white font-bold truncate leading-tight text-sm">
          {getPlayerName(player, lang)}
        </div>
        <div className="text-gray-400 text-xs mt-0.5">
          {player.position || '—'} · {player.avg?.teamAbbr ?? '—'}
        </div>
        <div className="text-green-400 font-bold text-sm mt-0.5">${player.tier?.salary}M</div>
      </div>

      {/* Sign button */}
      <div className="mt-2 h-8 flex items-center justify-center">
        {feedback ? (
          <span className={`text-xs font-semibold ${feedback.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {feedback.msg}
          </span>
        ) : alreadyOwned ? (
          <span className="text-gray-600 text-xs">{t(T.market.signed, lang)}</span>
        ) : (
          <button
            onClick={handleBuy}
            disabled={!canAfford}
            className={`text-sm font-semibold px-5 py-1 rounded-lg border transition-all duration-200 ${
              canAfford
                ? 'border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white'
                : 'border-gray-700 text-gray-600 cursor-not-allowed'
            }`}
          >
            {canAfford ? t(T.market.signBtn, lang) : t(T.market.cantAfford, lang)}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Market({ players, team }) {
  const { lang } = useSettings()
  const teamIds = team.team.map(p => p.id)
  const { marketPlayers, refreshMarket, removeFromMarket, nextRefreshMs } = useMarket(players, teamIds)
  const [countdown, setCountdown] = useState(nextRefreshMs)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1000
        if (next <= 0) {
          refreshMarket(teamIds)
          return 4 * 60 * 60 * 1000
        }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  function handleBuy(player) {
    const result = team.buyPlayer(player)
    if (result.ok) removeFromMarket(player.id)
    return result
  }

  function handleSelect(player) {
    setSelectedPlayer(prev => prev?.id === player.id ? null : player)
  }

  return (
    <div className="relative h-full overflow-hidden text-white flex flex-col"
      style={{ background: 'var(--bg-app)' }}>

      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.8) 100%)',
        zIndex: 1,
      }} />
      <div className="absolute pointer-events-none" style={{
        top: '-5%', left: '15%', right: '15%', height: '75%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,150,40,0.15) 0%, rgba(255,120,20,0.04) 40%, transparent 70%)',
        zIndex: 1,
      }} />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: '20%',
        backgroundImage: 'radial-gradient(circle, rgba(255,190,100,0.06) 1px, transparent 1px)',
        backgroundSize: '18px 13px',
        maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
        zIndex: 1,
      }} />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-8 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏀</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{t(T.market.title, lang)}</h1>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-green-400 font-bold text-xl leading-tight">${team.cash}M</div>
            <div className="text-gray-600 text-xs">{t(T.market.cash, lang)}</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-xl leading-tight ${team.capRemaining < 10 ? 'text-red-400' : 'text-blue-400'}`}>
              ${team.capRemaining}M
            </div>
            <div className="text-gray-600 text-xs">{t(T.market.capSpace, lang)}</div>
          </div>
          <div className="text-center">
            <div className="text-orange-300 font-bold text-xl leading-tight">{formatCountdown(countdown, lang)}</div>
            <div className="text-gray-600 text-xs">{t(T.market.untilRefresh, lang)}</div>
          </div>
          {import.meta.env.DEV && (
            <button
              onClick={() => { refreshMarket(teamIds); setCountdown(4 * 60 * 60 * 1000) }}
              className="bg-gray-900/80 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all"
            >
              {t(T.market.refreshBtn, lang)}
            </button>
          )}
        </div>
      </div>

      {/* ── Stage: player cards ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center"
        style={{ paddingBottom: selectedPlayer ? 160 : 0, transition: 'padding-bottom 0.3s ease' }}>
        {marketPlayers.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-5 text-lg">{t(T.market.empty, lang)}</p>
            <button onClick={() => refreshMarket(teamIds)}
              className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-2.5 rounded-lg font-semibold text-base transition-colors">
              {t(T.market.generate, lang)}
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-center gap-5 px-8">
            {marketPlayers.map(player => (
              <PlayerMarketCard
                key={player.id}
                player={player}
                onBuy={handleBuy}
                canAfford={team.cash >= (player.tier?.salary ?? 0) && team.capRemaining >= (player.tier?.salary ?? 0)}
                alreadyOwned={teamIds.includes(player.id)}
                selected={selectedPlayer?.id === player.id}
                onSelect={handleSelect}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom stats panel ── */}
      {selectedPlayer && (
        <StatsPanel player={selectedPlayer} onClose={() => setSelectedPlayer(null)} lang={lang} />
      )}
    </div>
  )
}
