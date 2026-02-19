import { useState, useEffect } from 'react'
import { useMarket } from '../hooks/useMarket'
import PlayerAvatar from '../components/PlayerAvatar'
import TierBadge from '../components/TierBadge'

function formatCountdown(ms) {
  if (ms <= 0) return 'Refreshing...'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

function MarketCard({ player, onBuy, canAfford, alreadyOwned }) {
  const { avg, tier, fantasyScore } = player
  const stat = (val) => val != null ? Number(val).toFixed(1) : '—'
  const [feedback, setFeedback] = useState(null)

  function handleBuy() {
    const result = onBuy(player)
    if (result.ok) {
      setFeedback({ type: 'ok', msg: 'Added to team!' })
    } else {
      setFeedback({ type: 'err', msg: result.reason })
      setTimeout(() => setFeedback(null), 2500)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate">
            {player.first_name} {player.last_name}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {avg?.teamAbbr ?? '—'} · {player.position || '—'}
          </div>
        </div>
        <TierBadge tier={tier} size="md" />
      </div>

      <div className="grid grid-cols-5 gap-1 text-center">
        {[
          { label: 'PTS', value: stat(avg?.pts) },
          { label: 'REB', value: stat(avg?.reb) },
          { label: 'AST', value: stat(avg?.ast) },
          { label: 'STL', value: stat(avg?.stl) },
          { label: 'BLK', value: stat(avg?.blk) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded py-1">
            <div className="text-white text-sm font-semibold">{value}</div>
            <div className="text-gray-500 text-xs">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Fantasy: <span className="text-orange-400 font-semibold">{Number(fantasyScore).toFixed(1)}</span>
        </span>
        <span className="text-green-400 font-bold">${tier?.salary}M</span>
      </div>

      {feedback ? (
        <div className={`text-center text-sm font-semibold py-1.5 rounded-lg ${
          feedback.type === 'ok' ? 'text-green-400' : 'text-red-400'
        }`}>
          {feedback.msg}
        </div>
      ) : alreadyOwned ? (
        <div className="text-center text-sm text-gray-500 py-1.5">Already on your team</div>
      ) : (
        <button
          onClick={handleBuy}
          disabled={!canAfford}
          className={`w-full text-sm font-semibold py-1.5 rounded-lg transition-colors ${
            canAfford
              ? 'bg-orange-500 hover:bg-orange-400 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canAfford ? `Buy · $${tier?.salary}M` : 'Can\'t afford'}
        </button>
      )}
    </div>
  )
}

export default function Market({ players, team }) {
  const teamIds = team.team.map(p => p.id)
  const { marketPlayers, refreshMarket, removeFromMarket, nextRefreshMs } = useMarket(players, teamIds)
  const [countdown, setCountdown] = useState(nextRefreshMs)

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

  return (
    <div className="p-4 md:p-6 text-white max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">Market</h1>
          <p className="text-gray-400 text-sm">5 players available · refreshes in {formatCountdown(countdown)}</p>
        </div>
        <button
          onClick={() => { refreshMarket(teamIds); setCountdown(4 * 60 * 60 * 1000) }}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-white px-4 py-2 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Cap + Cash bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="text-xs text-gray-400 mb-1">Cash Available</div>
          <div className="text-green-400 font-bold text-lg">${team.cash}M</div>
        </div>
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="text-xs text-gray-400 mb-1">Cap Space</div>
          <div className={`font-bold text-lg ${team.capRemaining < 10 ? 'text-red-400' : 'text-blue-400'}`}>
            ${team.capRemaining}M
          </div>
        </div>
      </div>

      {/* Market cards */}
      {marketPlayers.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="mb-4">Market is empty</p>
          <button
            onClick={() => refreshMarket(teamIds)}
            className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Generate Market
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {marketPlayers.map(player => (
            <MarketCard
              key={player.id}
              player={player}
              onBuy={handleBuy}
              canAfford={team.cash >= (player.tier?.salary ?? 0) && team.capRemaining >= (player.tier?.salary ?? 0)}
              alreadyOwned={teamIds.includes(player.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
