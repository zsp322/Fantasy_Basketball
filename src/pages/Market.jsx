import { useState, useMemo } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import PlayerCard from '../components/PlayerCard'
import { TIERS } from '../utils/tiers'

const POSITIONS = ['All', 'G', 'F', 'C', 'G-F', 'F-C']

export default function Market() {
  const { players, loading, error } = usePlayers()
  const [search, setSearch] = useState('')
  const [selectedTier, setSelectedTier] = useState('All')
  const [selectedPos, setSelectedPos] = useState('All')
  const [sortBy, setSortBy] = useState('tier')

  const filtered = useMemo(() => {
    let result = [...players]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.team?.abbreviation?.toLowerCase().includes(q)
      )
    }

    if (selectedTier !== 'All') {
      result = result.filter(p => p.tier?.name === selectedTier)
    }

    if (selectedPos !== 'All') {
      result = result.filter(p => p.position === selectedPos)
    }

    if (sortBy === 'tier') {
      const tierOrder = TIERS.map(t => t.name)
      result.sort((a, b) => tierOrder.indexOf(a.tier?.name) - tierOrder.indexOf(b.tier?.name))
    } else if (sortBy === 'score') {
      result.sort((a, b) => b.fantasyScore - a.fantasyScore)
    } else if (sortBy === 'salary_asc') {
      result.sort((a, b) => (a.tier?.salary ?? 0) - (b.tier?.salary ?? 0))
    } else if (sortBy === 'salary_desc') {
      result.sort((a, b) => (b.tier?.salary ?? 0) - (a.tier?.salary ?? 0))
    }

    return result
  }, [players, search, selectedTier, selectedPos, sortBy])

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 text-lg font-semibold mb-2">Failed to load players</div>
        <div className="text-gray-400 text-sm">{error}</div>
        <div className="text-gray-500 text-xs mt-4">
          Make sure your <code className="bg-gray-800 px-1 rounded">VITE_BALLDONTLIE_API_KEY</code> is set in a <code className="bg-gray-800 px-1 rounded">.env</code> file.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 text-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Player Market</h1>
        <p className="text-gray-400 mt-1">
          {loading ? 'Loading players...' : `${filtered.length} players · $200M salary cap`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search player or team..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-400 w-full sm:w-64"
        />

        <select
          value={selectedTier}
          onChange={e => setSelectedTier(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
        >
          <option value="All">All Tiers</option>
          {TIERS.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>

        <select
          value={selectedPos}
          onChange={e => setSelectedPos(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
        >
          {POSITIONS.map(p => (
            <option key={p} value={p}>{p === 'All' ? 'All Positions' : p}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
        >
          <option value="tier">Sort: Tier</option>
          <option value="score">Sort: Fantasy Score</option>
          <option value="salary_desc">Sort: Salary ↓</option>
          <option value="salary_asc">Sort: Salary ↑</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-52 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-16">
              No players found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
