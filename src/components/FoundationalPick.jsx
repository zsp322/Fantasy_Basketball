import { useState } from 'react'
import PlayerAvatar from './PlayerAvatar'
import TierBadge from './TierBadge'

export default function FoundationalPick({ sPlayers, onPick }) {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = sPlayers.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  const stat = (val) => val != null ? Number(val).toFixed(1) : '—'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-12">
      <h1 className="text-4xl font-bold mb-1">范特西篮球</h1>
      <p className="text-gray-400 mb-2">Welcome! Build your team.</p>

      <div className="bg-gray-900 border border-yellow-400/30 rounded-2xl p-6 max-w-2xl w-full mt-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⭐</span>
          <div>
            <h2 className="text-xl font-bold text-yellow-400">Choose Your Foundational Player</h2>
            <p className="text-gray-400 text-sm">Pick one S-tier superstar to anchor your team. Choose wisely.</p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search player..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:border-yellow-400"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {filtered.map(player => {
            const isSelected = selected?.id === player.id
            return (
              <button
                key={player.id}
                onClick={() => setSelected(player)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <PlayerAvatar player={player} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {player.first_name} {player.last_name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {player.avg?.teamAbbr ?? '—'} · {player.position || '—'}
                  </div>
                  <div className="text-gray-300 text-xs mt-0.5">
                    {stat(player.avg?.pts)} PTS · {stat(player.avg?.reb)} REB · {stat(player.avg?.ast)} AST
                  </div>
                </div>
                <TierBadge tier={player.tier} size="sm" />
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="mt-6 max-w-2xl w-full bg-gray-900 border border-yellow-400/50 rounded-2xl p-4 flex items-center gap-4">
          <PlayerAvatar player={selected} size="md" />
          <div className="flex-1">
            <div className="font-bold text-yellow-400">{selected.first_name} {selected.last_name}</div>
            <div className="text-gray-400 text-sm">{selected.tier?.name} · ${selected.tier?.salary}M salary</div>
          </div>
          <button
            onClick={() => onPick(selected)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl transition-colors"
          >
            Lock In →
          </button>
        </div>
      )}
    </div>
  )
}
