import { useState } from 'react'
import { ROOKIE_PLAYERS, ROOKIE_TOTAL_WEIGHT } from '../data/rookiePlayers'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getTierBorderColor, getTierGlow } from '../utils/tiers'
import { getPlayerShortName, getPlayerName } from '../data/playerNames'
import RadarChart from '../components/RadarChart'

const SPIN_COST = 5

/** Weighted random draw — pick #1 (draftPick=1) is rarest, pick #12 most common */
function pickWeightedRookie() {
  let rand = Math.random() * ROOKIE_TOTAL_WEIGHT
  for (const player of ROOKIE_PLAYERS) {
    rand -= player.draftPick
    if (rand <= 0) return player
  }
  return ROOKIE_PLAYERS[ROOKIE_PLAYERS.length - 1]
}

function getPct(player) {
  return (player.draftPick / ROOKIE_TOTAL_WEIGHT * 100).toFixed(1) + '%'
}

// ── Card back ─────────────────────────────────────────────────────────────────
function CardBack() {
  return (
    <div
      style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        border: '2px solid rgba(139,92,246,0.6)',
        borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 8,
        boxShadow: '0 0 32px 8px rgba(139,92,246,0.35), 0 4px 24px rgba(0,0,0,0.8)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(167,139,250,0.15) 0%, transparent 70%)',
      }} />
      <div style={{ fontSize: 52, opacity: 0.7 }}>🏀</div>
      <div style={{ color: 'rgba(167,139,250,0.8)', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
        2025 ROOKIE
      </div>
    </div>
  )
}

// ── Card front (photo-only — no bottom strip; stats shown in side panel) ──────
function CardFront({ player }) {
  if (!player) return null
  const tierName = player.tier?.name
  const borderColor = getTierBorderColor(tierName)
  const glow = getTierGlow(tierName)

  return (
    <div
      style={{
        width: '100%', height: '100%',
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        overflow: 'hidden',
        background: '#0f172a',
        position: 'relative',
        boxShadow: `0 0 32px 10px ${glow}, 0 4px 24px rgba(0,0,0,0.8)`,
      }}
    >
      {/* Full-height photo or initials */}
      {player.headshot ? (
        <img
          src={player.headshot}
          alt={player.last_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <div
          style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 800, color: borderColor, opacity: 0.85 }}>
            {player.first_name?.[0]}{player.last_name?.[0]}
          </div>
        </div>
      )}

      {/* Tier badge */}
      <div
        className={`absolute top-1 right-1 text-black font-bold px-1 rounded ${player.tier?.color ?? 'bg-gray-400'}`}
        style={{ fontSize: '0.65rem', lineHeight: '1.4' }}
      >
        {tierName}
      </div>

      {/* Position badge */}
      <div
        className="absolute top-1 left-1 text-gray-200 font-bold bg-black/60 px-1 rounded"
        style={{ fontSize: '0.65rem', lineHeight: '1.4' }}
      >
        {(player.positions ?? [player.position]).join('/')}
      </div>

      {/* Pick badge */}
      <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <span style={{
          background: 'rgba(139,92,246,0.9)',
          color: '#fff', fontSize: 9, fontWeight: 800,
          padding: '1px 7px', borderRadius: 3, letterSpacing: 1,
        }}>
          #{player.draftPick} PICK
        </span>
      </div>
    </div>
  )
}

// ── Inline stats panel — shown beside the card on reveal ──────────────────────
function RookieStatsPanel({ player, lang }) {
  if (!player) return null
  const avg = player.avg
  const stat = v => (v != null ? Number(v).toFixed(1) : '—')
  const tierName = player.tier?.name
  const borderColor = getTierBorderColor(tierName)

  const statRows = [
    { key: 'PTS', label: t(T.shared.pts, lang), value: stat(avg?.pts), color: 'text-orange-300', max: 35 },
    { key: 'REB', label: t(T.shared.reb, lang), value: stat(avg?.reb), color: 'text-blue-300',   max: 15 },
    { key: 'AST', label: t(T.shared.ast, lang), value: stat(avg?.ast), color: 'text-green-300',  max: 12 },
    { key: 'STL', label: t(T.shared.stl, lang), value: stat(avg?.stl), color: 'text-yellow-300', max: 3 },
    { key: 'BLK', label: t(T.shared.blk, lang), value: stat(avg?.blk), color: 'text-purple-300', max: 3.5 },
    { key: 'TO',  label: t(T.shared.to,  lang), value: stat(avg?.to),  color: 'text-red-400',    max: 5 },
  ]

  return (
    <div
      className="rounded-xl border border-gray-700/60 overflow-hidden flex flex-col"
      style={{
        width: 200, height: 210,
        background: 'rgba(8,10,20,0.96)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      }}
    >
      {/* Header: name + tier + ATK/DEF */}
      <div className="flex items-start gap-2 p-2.5 pb-2 border-b border-gray-800/60">
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm leading-tight truncate">
            {getPlayerName(player, lang)}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${player.tier?.color ?? 'bg-gray-500 text-white'}`}>
              {tierName}
            </span>
            <span className="text-green-400 text-xs font-bold">${player.tier?.salary}M cap</span>
          </div>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <div className="text-center">
            <div className="text-orange-400 font-bold text-base leading-tight">{player.offenseRating}</div>
            <div className="text-gray-500 text-xs">{t(T.shared.atk, lang)}</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-bold text-base leading-tight">{player.defenseRating}</div>
            <div className="text-gray-500 text-xs">{t(T.shared.def, lang)}</div>
          </div>
        </div>
      </div>

      {/* Body: radar + stat bars */}
      <div className="flex items-center gap-1 px-2 py-1.5 flex-1">
        <RadarChart avg={avg} size={100} radius={32} />
        <div className="flex flex-col gap-1 flex-1">
          {statRows.map(({ key, label, value, color, max }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-500 text-xs w-6">{label}</span>
              <div className="flex-1 mx-1 bg-gray-800 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${color.replace('text-', 'bg-')}`}
                  style={{ width: `${Math.min((Number(value) / max) * 100, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-semibold w-6 text-right ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Odds table ────────────────────────────────────────────────────────────────
function OddsTable({ lang }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ width: 340 }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="text-gray-400 text-xs uppercase tracking-wider">
          {t(T.slotMachine.oddsTitle, lang)}
        </span>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          className="mt-1 rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="grid text-gray-500 uppercase tracking-wider"
            style={{ gridTemplateColumns: '32px 1fr 44px 52px 52px', fontSize: 9, padding: '4px 8px' }}
          >
            <span>#</span>
            <span>{t(T.slotMachine.oddsPlayer, lang)}</span>
            <span className="text-center">Tier</span>
            <span className="text-right">Cap</span>
            <span className="text-right">{t(T.slotMachine.oddsPct, lang)}</span>
          </div>
          {ROOKIE_PLAYERS.map(p => {
            const borderColor = getTierBorderColor(p.tier?.name)
            return (
              <div
                key={p.id}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '32px 1fr 44px 52px 52px',
                  fontSize: 10, padding: '3px 8px',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span className="text-gray-600">#{p.draftPick}</span>
                <span className="truncate font-medium" style={{ color: borderColor }}>{p.last_name}</span>
                <span className={`text-center font-bold text-black rounded px-0.5 ${p.tier?.color ?? 'bg-gray-400'}`} style={{ fontSize: 8 }}>
                  {p.tier?.name}
                </span>
                <span className="text-green-400 text-right">${p.tier?.salary}M</span>
                <span className="text-purple-400 font-bold text-right">{getPct(p)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SlotMachine({ team }) {
  const { lang } = useSettings()
  const { cash, team: roster, payForSpin, signRookie, clearPendingRookie,
          pendingRookie, capRemaining, rosterFull } = team

  // Restore revealed state if a pending rookie exists (user switched tabs mid-decision)
  const [phase, setPhase] = useState(() => pendingRookie ? 'revealed' : 'idle')
  const [result, setResult] = useState(() => pendingRookie ?? null)
  const [errorKey, setErrorKey] = useState(null)
  const [lastSigned, setLastSigned] = useState(null)

  const signedRookieCount = roster.filter(p => p.isRookie).length
  const canSpin = cash >= SPIN_COST && !rosterFull && phase === 'idle'

  function handleSpin(free = false) {
    if (!free && !canSpin) return

    // Pick the rookie BEFORE the animation so it's persisted immediately
    const pick = pickWeightedRookie()
    const res = payForSpin(pick, free)
    if (!res.ok) { setErrorKey(res.reason); return }

    setPhase('spinning')
    setResult(null)
    setErrorKey(null)
    setLastSigned(null)

    setTimeout(() => {
      setResult(pick)
      setPhase('revealed')
    }, 1300)
  }

  function handleSign() {
    const res = signRookie()
    if (res.ok) {
      setLastSigned(result)
      setPhase('idle')
      setResult(null)
    } else {
      setErrorKey(res.reason)
    }
  }

  function handlePass() {
    clearPendingRookie()
    setPhase('idle')
    setResult(null)
    setErrorKey(null)
  }

  const errorMsg = errorKey === 'cash'        ? t(T.slotMachine.noCash, lang)
                 : errorKey === 'cap'         ? t(T.slotMachine.noCap, lang)
                 : errorKey === 'roster_full' ? t(T.slotMachine.rosterFull, lang)
                 : null

  const isFlipped = phase === 'spinning' || phase === 'revealed'

  return (
    <div
      className="h-full flex flex-col items-center justify-center gap-4 overflow-hidden"
      style={{ background: 'var(--bg-app)' }}
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          {t(T.slotMachine.title, lang)}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {t(T.slotMachine.subtitle, lang)}
        </p>
      </div>

      {/* Stats bar — hidden during reveal to save vertical space */}
      {phase !== 'revealed' && (
        <div className="flex gap-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs uppercase tracking-wider">{t(T.myTeam.cash, lang)}</span>
            <span className="text-green-400 font-bold text-lg">${cash}M</span>
          </div>
          <div className="w-px bg-gray-800" />
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs uppercase tracking-wider">{t(T.slotMachine.capLeft, lang)}</span>
            <span className="text-blue-400 font-bold text-lg">${capRemaining}M</span>
          </div>
          <div className="w-px bg-gray-800" />
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs uppercase tracking-wider">{t(T.slotMachine.rookieTag, lang)}</span>
            <span className="text-purple-400 font-bold text-lg">{signedRookieCount}</span>
          </div>
        </div>
      )}

      {/* Card + (on reveal) side stats panel */}
      <div className="flex items-center gap-4">
        {/* 3D Card flip */}
        <div style={{ perspective: 800, width: 155, height: 210, flexShrink: 0 }}>
          <div
            style={{
              position: 'relative', width: '100%', height: '100%',
              transformStyle: 'preserve-3d',
              transition: isFlipped
                ? 'transform 1.3s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
              <CardBack />
            </div>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <CardFront player={result} />
            </div>
          </div>
        </div>

        {/* Stats panel — slides in on reveal */}
        {phase === 'revealed' && result && (
          <RookieStatsPanel player={result} lang={lang} />
        )}

        {/* Placeholder width during idle/spinning to keep card centered */}
        {phase !== 'revealed' && <div style={{ width: 0 }} />}
      </div>

      {/* Action area */}
      <div className="flex flex-col items-center gap-2">
        {phase === 'revealed' ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-300 text-sm font-medium">
              {t(T.slotMachine.signPrompt, lang)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSign}
                disabled={capRemaining < (result?.tier?.salary ?? 0) || rosterFull}
                className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#fff',
                  boxShadow: '0 0 16px 4px rgba(124,58,237,0.4)',
                }}
              >
                {t(T.slotMachine.signBtn, lang, result?.tier?.salary ?? 0)}
              </button>
              <button
                onClick={handlePass}
                className="px-6 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#1f2937', color: '#9ca3af', border: '1px solid #374151' }}
              >
                {t(T.slotMachine.passBtn, lang)}
              </button>
            </div>
            {errorMsg && <span className="text-red-400 text-xs">{errorMsg}</span>}
          </div>
        ) : (
          <>
            <button
              onClick={() => handleSpin(false)}
              disabled={!canSpin || phase === 'spinning'}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={canSpin && phase === 'idle' ? {
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                boxShadow: '0 0 20px 4px rgba(124,58,237,0.4)',
              } : {
                background: '#1f2937',
                color: '#6b7280',
              }}
            >
              {phase === 'spinning' ? '✦ ✦ ✦' : t(T.slotMachine.spinBtn, lang)}
            </button>

            {phase === 'idle' && (
              <span className="text-gray-600 text-xs">{t(T.slotMachine.spinCost, lang)}</span>
            )}
            {phase === 'idle' && cash < SPIN_COST && (
              <span className="text-red-500 text-xs">{t(T.slotMachine.noCash, lang)}</span>
            )}
            {errorMsg && phase === 'idle' && (
              <span className="text-red-400 text-xs">{errorMsg}</span>
            )}

            {/* Dev-only free spin */}
            {import.meta.env.DEV && phase === 'idle' && (
              <button
                onClick={() => handleSpin(true)}
                disabled={rosterFull}
                className="px-4 py-1 rounded text-xs font-mono disabled:opacity-40"
                style={{ background: 'rgba(234,179,8,0.15)', color: '#ca8a04', border: '1px dashed #854d0e' }}
              >
                [DEV] Free Spin
              </button>
            )}
          </>
        )}
      </div>

      {/* Last signed banner */}
      {phase === 'idle' && lastSigned && (
        <div className="text-center">
          <span className="text-purple-400 text-sm">
            {t(T.slotMachine.gotPlayer, lang)}{lang === 'zh' ? '' : ' '}
            <span className="text-white font-bold">{getPlayerShortName(lastSigned, lang)}</span>!
          </span>
        </div>
      )}

      {/* Odds table */}
      {phase === 'idle' && <OddsTable lang={lang} />}

      {/* Signed rookies strip */}
      {phase === 'idle' && signedRookieCount > 0 && (
        <div className="flex gap-2 flex-wrap justify-center" style={{ maxWidth: 360 }}>
          {roster.filter(p => p.isRookie).map(p => (
            <div key={p.id} className="flex flex-col items-center gap-0.5" style={{ width: 44 }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 8,
                  border: `2px solid ${getTierBorderColor(p.tier?.name)}`,
                  background: '#0f172a', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {p.headshot
                  ? <img src={p.headshot} alt={p.last_name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  : <span style={{ fontSize: 14, fontWeight: 800, color: getTierBorderColor(p.tier?.name) }}>{p.first_name?.[0]}{p.last_name?.[0]}</span>
                }
              </div>
              <span className="text-gray-500 text-center truncate w-full" style={{ fontSize: 9 }}>
                {p.last_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
