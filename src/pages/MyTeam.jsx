import { useState } from 'react'
import CourtView from '../components/CourtView'
import SwapDrawer from '../components/SwapDrawer'
import PlayerAvatar from '../components/PlayerAvatar'
import TierBadge from '../components/TierBadge'
import { SALARY_CAP } from '../utils/teamSetup'

const POS_ORDER = ['PG', 'SG', 'SF', 'PF', 'C']

function useStarters(roster) {
  const [starters, setStarters] = useState(() => {
    const map = {}
    for (const pos of POS_ORDER) {
      const match = roster.find(p =>
        p.position === pos && !Object.values(map).find(s => s?.id === p.id)
      )
      map[pos] = match ?? null
    }
    return map
  })

  function assign(pos, player) {
    setStarters(prev => {
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        if (next[k]?.id === player.id) next[k] = null
      }
      next[pos] = player
      return next
    })
  }

  function remove(pos) {
    setStarters(prev => ({ ...prev, [pos]: null }))
  }

  return { starters, assign, remove }
}

function CapBar({ used, cap }) {
  const pct = Math.min((used / cap) * 100, 100)
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function BenchCard({ player, onDrop }) {
  const [confirming, setConfirming] = useState(false)
  const stat = (val) => val != null ? Number(val).toFixed(1) : '—'
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
      <PlayerAvatar player={player} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-white font-semibold text-sm truncate">{player.first_name} {player.last_name}</span>
          {player.status === 'Out' && <span className="text-red-400 text-xs font-bold">OUT</span>}
          {player.status === 'Day-To-Day' && <span className="text-orange-400 text-xs font-bold">DTD</span>}
          {player.status === 'Questionable' && <span className="text-yellow-400 text-xs font-bold">Q</span>}
        </div>
        <div className="text-gray-400 text-xs mt-0.5">
          {player.avg?.teamAbbr ?? '—'} · {player.position || '—'} ·{' '}
          <span className="text-orange-300">{stat(player.avg?.pts)}</span> / {stat(player.avg?.reb)} / {stat(player.avg?.ast)}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <TierBadge tier={player.tier} size="sm" />
        <span className="text-green-400 text-xs font-bold">${player.tier?.salary}M</span>
        {confirming ? (
          <div className="flex gap-1">
            <button onClick={() => onDrop(player.id)} className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded-lg">Drop</button>
            <button onClick={() => setConfirming(false)} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-lg">✕</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-xs text-gray-600 hover:text-red-400 px-1 py-1 transition-colors">Drop</button>
        )}
      </div>
    </div>
  )
}

export default function MyTeam({ team }) {
  const { team: roster, totalSalary, capRemaining, cash, dropPlayer, resetTeam } = team
  const { starters, assign, remove } = useStarters(roster)
  const [drawer, setDrawer] = useState(null)
  const [tab, setTab] = useState('court')

  const starterIds = Object.values(starters).filter(Boolean).map(p => p.id)
  const bench = roster.filter(p => !starterIds.includes(p.id))
  const starterCount = Object.values(starters).filter(Boolean).length

  return (
    <div className="min-h-screen text-white pb-8" style={{
      background: 'radial-gradient(ellipse at 50% 0%, rgba(120,53,15,0.5) 0%, rgba(3,7,18,1) 55%)',
    }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-xl font-bold">My Team</h1>
          <p className="text-gray-400 text-xs">{starterCount}/5 starters · {roster.length}/15 roster</p>
        </div>
        <button
          onClick={() => { if (window.confirm('Reset your team and start over?')) resetTeam() }}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Cash + Cap */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-3">
        <div className="bg-black/40 border border-gray-800 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-gray-400 text-xs">Cash</span>
          <span className="text-green-400 font-bold">${cash}M</span>
        </div>
        <div className="bg-black/40 border border-gray-800 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-gray-400 text-xs">Cap Space</span>
          <span className={`font-bold ${capRemaining < 10 ? 'text-red-400' : 'text-blue-400'}`}>${capRemaining}M</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-3">
        {[{ key: 'court', label: '🏀 Court' }, { key: 'bench', label: `Bench (${bench.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-orange-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'court' && (
        <div className="px-3">
          <CourtView starters={starters} onSlotClick={(pos, player) => setDrawer({ pos, player })} />
          <div className="mt-3 bg-black/40 border border-gray-800 rounded-xl px-4 py-3">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Salary: <span className="text-white font-semibold">${totalSalary}M</span> / $200M</span>
              <span>{((totalSalary / SALARY_CAP) * 100).toFixed(0)}% used</span>
            </div>
            <CapBar used={totalSalary} cap={SALARY_CAP} />
          </div>
          <p className="text-center text-gray-600 text-xs mt-3">Tap a position to assign or swap</p>
        </div>
      )}

      {tab === 'bench' && (
        <div className="px-4 flex flex-col gap-2">
          {bench.length === 0
            ? <p className="text-gray-500 text-center py-12">All players are starting</p>
            : bench.map(p => <BenchCard key={p.id} player={p} onDrop={dropPlayer} />)
          }
        </div>
      )}

      {drawer && (
        <SwapDrawer
          pos={drawer.pos}
          currentPlayer={drawer.player}
          benchPlayers={bench.filter(p => p.id !== drawer.player?.id)}
          onAssign={assign}
          onRemove={remove}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}
