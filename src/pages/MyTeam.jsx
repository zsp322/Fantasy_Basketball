import { useState } from 'react'
import PlayerAvatar from '../components/PlayerAvatar'
import TierBadge from '../components/TierBadge'
import { SALARY_CAP } from '../utils/teamSetup'

function CapBar({ used, cap }) {
  const pct = Math.min((used / cap) * 100, 100)
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PlayerRow({ player, onDrop }) {
  const { avg, tier } = player
  const stat = (val) => val != null ? Number(val).toFixed(1) : '—'
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
      <PlayerAvatar player={player} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-sm truncate">
            {player.first_name} {player.last_name}
          </span>
          {player.status === 'Out' && <span className="text-red-400 text-xs">OUT</span>}
          {player.status === 'Day-To-Day' && <span className="text-orange-400 text-xs">DTD</span>}
          {player.status === 'Questionable' && <span className="text-yellow-400 text-xs">Q</span>}
        </div>
        <div className="text-gray-400 text-xs">
          {avg?.teamAbbr ?? '—'} · {player.position || '—'} ·{' '}
          <span className="text-orange-400">{stat(avg?.pts)} PTS</span>{' '}
          {stat(avg?.reb)} REB · {stat(avg?.ast)} AST
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <TierBadge tier={tier} size="sm" />
        <span className="text-green-400 text-xs font-bold">${tier?.salary}M</span>
        {confirming ? (
          <div className="flex gap-1">
            <button onClick={() => onDrop(player.id)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded">
              Drop
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-xs text-gray-500 hover:text-red-400 px-2 py-1 rounded transition-colors">
            Drop
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyTeam({ team }) {
  const { team: roster, totalSalary, capRemaining, cash, dropPlayer, resetTeam } = team

  return (
    <div className="p-4 md:p-6 text-white max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Team</h1>
        <button
          onClick={() => { if (window.confirm('Reset your team and start over?')) resetTeam() }}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Reset Team
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Roster</div>
          <div className="text-white font-bold text-lg">{roster.length}<span className="text-gray-500 text-sm">/15</span></div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Cash</div>
          <div className="text-green-400 font-bold text-lg">${cash}M</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Cap Space</div>
          <div className={`font-bold text-lg ${capRemaining < 10 ? 'text-red-400' : 'text-blue-400'}`}>
            ${capRemaining}M
          </div>
        </div>
      </div>

      {/* Cap bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Salary Used: <span className="text-white font-semibold">${totalSalary}M</span></span>
          <span>Cap: <span className="text-white font-semibold">${SALARY_CAP}M</span></span>
        </div>
        <CapBar used={totalSalary} cap={SALARY_CAP} />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {((totalSalary / SALARY_CAP) * 100).toFixed(1)}% used
        </div>
      </div>

      {/* Roster list */}
      <div className="flex flex-col gap-2">
        {roster.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No players on your team</p>
        ) : (
          roster.map(player => (
            <PlayerRow key={player.id} player={player} onDrop={dropPlayer} />
          ))
        )}
      </div>
    </div>
  )
}
