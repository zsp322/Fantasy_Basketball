import PlayerAvatar from './PlayerAvatar'
import TierBadge from './TierBadge'

const INJURY_BADGES = {
  Out: { label: '🔴 OUT', class: 'text-red-400' },
  'Day-To-Day': { label: '🟠 DTD', class: 'text-orange-400' },
  Questionable: { label: '🟡 Q', class: 'text-yellow-400' },
}

export default function PlayerCard({ player }) {
  const { avg, tier, fantasyScore } = player
  const fullName = `${player.first_name} ${player.last_name}`
  const injury = INJURY_BADGES[player.status] ?? null

  const stat = (val, digits = 1) =>
    val != null ? Number(val).toFixed(digits) : '—'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold truncate">{fullName}</span>
            {injury && (
              <span className={`text-xs font-medium ${injury.class}`}>
                {injury.label}
              </span>
            )}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {avg?.teamAbbr ?? '—'} · {player.position || '—'}
          </div>
        </div>
        <TierBadge tier={tier} size="md" />
      </div>

      {/* Stats row */}
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

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-gray-400 text-xs">
          Fantasy: <span className="text-orange-400 font-semibold">{stat(fantasyScore)} pts/g</span>
        </div>
        <div className="text-green-400 font-bold text-sm">
          ${tier ? tier.salary : '—'}M
        </div>
      </div>

      <button className="w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-1.5 rounded-lg transition-colors">
        Bid / Add
      </button>
    </div>
  )
}
