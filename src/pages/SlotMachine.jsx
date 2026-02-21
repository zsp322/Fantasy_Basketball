import { useState } from 'react'
import { ROOKIE_PLAYERS } from '../data/rookiePlayers'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getTierBorderColor, getTierGlow } from '../utils/tiers'
import { getPlayerShortName } from '../data/playerNames'

const SPIN_COST = 5

// ── Card back — shown before spin ─────────────────────────────────────────────
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer */}
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

// ── Revealed player card ───────────────────────────────────────────────────────
function CardFront({ player, lang }) {
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
      {/* Photo or initials */}
      {player.headshot ? (
        <img
          src={player.headshot}
          alt={player.last_name}
          style={{ width: '100%', height: '65%', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : (
        <div
          style={{
            height: '65%',
            background: `linear-gradient(160deg, #1e293b 0%, #0f172a 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6,
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 800, color: borderColor, opacity: 0.85 }}>
            {player.first_name?.[0]}{player.last_name?.[0]}
          </div>
          <div
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2,
              color: 'rgba(139,92,246,0.8)',
              background: 'rgba(139,92,246,0.15)',
              padding: '2px 8px', borderRadius: 4,
            }}
          >
            2025 ROOKIE
          </div>
        </div>
      )}

      {/* Bottom strip */}
      <div
        style={{ height: '35%', background: 'rgba(0,0,0,0.92)' }}
        className="flex flex-col items-center justify-center px-2 gap-0.5"
      >
        <span
          className="text-white font-semibold truncate w-full text-center"
          style={{ fontSize: 'clamp(10px, 1.2vw, 14px)' }}
        >
          {getPlayerShortName(player, lang)}
        </span>
        <span className="text-green-400 font-bold" style={{ fontSize: 12 }}>
          ${player.tier?.salary}M
        </span>
        <div className="flex gap-2 mt-0.5" style={{ fontSize: 10 }}>
          <span className="text-orange-400">ATK <b>{player.offenseRating}</b></span>
          <span className="text-blue-400">DEF <b>{player.defenseRating}</b></span>
        </div>
      </div>

      {/* Tier badge */}
      <div
        className={`absolute top-0.5 right-0.5 text-black font-bold px-0.5 rounded ${player.tier?.color ?? 'bg-gray-400'}`}
        style={{ fontSize: '0.6rem', lineHeight: '1.4' }}
      >
        {tierName}
      </div>

      {/* Position */}
      <div
        className="absolute top-0.5 left-0.5 text-gray-200 font-bold bg-black/60 px-0.5 rounded"
        style={{ fontSize: '0.6rem', lineHeight: '1.4' }}
      >
        {(player.positions ?? [player.position]).join('/')}
      </div>

      {/* Rookie badge */}
      <div
        style={{
          position: 'absolute', bottom: '36%', left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
        }}
      >
        <span style={{
          background: 'rgba(139,92,246,0.9)',
          color: '#fff', fontSize: 8, fontWeight: 800,
          padding: '1px 6px', borderRadius: 3, letterSpacing: 1,
        }}>
          ROOKIE
        </span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SlotMachine({ team }) {
  const { lang } = useSettings()
  const { cash, team: roster, spinForRookie, rosterFull } = team

  const [phase, setPhase] = useState('idle')    // 'idle' | 'spinning' | 'revealed'
  const [result, setResult] = useState(null)
  const [errorKey, setErrorKey] = useState(null) // 'cash' | 'cap' | 'roster_full'

  const ownedRookieIds = new Set(roster.filter(p => p.isRookie).map(p => p.id))
  const availableRookies = ROOKIE_PLAYERS.filter(p => !ownedRookieIds.has(p.id))
  const allOwned = availableRookies.length === 0

  const canSpin = !allOwned && cash >= SPIN_COST && !rosterFull && phase === 'idle'

  function handleSpin() {
    if (!canSpin) return
    setPhase('spinning')
    setResult(null)
    setErrorKey(null)

    const pick = availableRookies[Math.floor(Math.random() * availableRookies.length)]

    setTimeout(() => {
      const res = spinForRookie(pick)
      if (res.ok) {
        setResult(pick)
        setErrorKey(null)
      } else {
        setErrorKey(res.reason)
        setPhase('idle')
        return
      }
      setPhase('revealed')
    }, 1300)
  }

  function handleReset() {
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
      className="h-full flex flex-col items-center justify-center gap-6 overflow-hidden"
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

      {/* Stats bar */}
      <div className="flex gap-6 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-gray-500 text-xs uppercase tracking-wider">{t(T.myTeam.cash, lang)}</span>
          <span className="text-green-400 font-bold text-lg">${cash}M</span>
        </div>
        <div className="w-px bg-gray-800" />
        <div className="flex flex-col items-center">
          <span className="text-gray-500 text-xs uppercase tracking-wider">
            {allOwned ? t(T.slotMachine.allOwned, lang) : t(T.slotMachine.available, lang, availableRookies.length, ROOKIE_PLAYERS.length)}
          </span>
          {!allOwned && (
            <div className="flex gap-1 mt-0.5">
              {ROOKIE_PLAYERS.map(p => (
                <div
                  key={p.id}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: ownedRookieIds.has(p.id) ? '#7c3aed' : '#374151',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3D Card flip area */}
      <div style={{ perspective: 800, width: 155, height: 210 }}>
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
          {/* Front = card back (question mark) */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
            <CardBack />
          </div>

          {/* Back = revealed player (rotated 180 to face forward after flip) */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}>
            <CardFront player={result} lang={lang} />
          </div>
        </div>
      </div>

      {/* Result text */}
      <div className="h-8 flex items-center justify-center">
        {phase === 'revealed' && result && (
          <div className="text-center animate-pulse">
            <span className="text-purple-400 font-semibold text-sm">
              {t(T.slotMachine.gotPlayer, lang)}{lang === 'zh' ? '' : ' '}
              <span className="text-white font-bold">
                {getPlayerShortName(result, lang)}
              </span>
              !
            </span>
          </div>
        )}
        {errorMsg && (
          <span className="text-red-400 text-sm">{errorMsg}</span>
        )}
      </div>

      {/* Action button */}
      <div className="flex flex-col items-center gap-2">
        {phase === 'revealed' ? (
          <button
            onClick={handleReset}
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#fff',
              boxShadow: '0 0 20px 4px rgba(124,58,237,0.4)',
            }}
          >
            {t(T.slotMachine.spinAgain, lang)}
          </button>
        ) : (
          <button
            onClick={handleSpin}
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
            {phase === 'spinning' ? '✦ ✦ ✦' : (allOwned ? t(T.slotMachine.allOwned, lang) : t(T.slotMachine.spinBtn, lang))}
          </button>
        )}

        {!allOwned && phase === 'idle' && (
          <span className="text-gray-600 text-xs">{t(T.slotMachine.spinCost, lang)}</span>
        )}

        {phase === 'idle' && !allOwned && cash < SPIN_COST && (
          <span className="text-red-500 text-xs">{t(T.slotMachine.noCash, lang)}</span>
        )}
      </div>

      {/* Owned rookies strip */}
      {roster.filter(p => p.isRookie).length > 0 && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <span className="text-gray-600 text-xs uppercase tracking-wider">
            {t(T.slotMachine.rookieTag, lang)} ×{roster.filter(p => p.isRookie).length}
          </span>
          <div className="flex gap-2">
            {roster.filter(p => p.isRookie).map(p => (
              <div
                key={p.id}
                className="flex flex-col items-center gap-0.5"
                style={{ width: 44 }}
              >
                <div
                  style={{
                    width: 44, height: 44,
                    borderRadius: 8,
                    border: `2px solid ${getTierBorderColor(p.tier?.name)}`,
                    background: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: getTierBorderColor(p.tier?.name),
                  }}
                >
                  {p.first_name?.[0]}{p.last_name?.[0]}
                </div>
                <span className="text-gray-500 text-center truncate w-full" style={{ fontSize: 9 }}>
                  {p.last_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
