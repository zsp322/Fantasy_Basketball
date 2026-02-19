import PlayerAvatar from './PlayerAvatar'
import TierBadge from './TierBadge'
import { useSettings } from '../contexts/SettingsContext'
import { getPlayerName } from '../data/playerNames'

export default function SwapDrawer({ pos, currentPlayer, benchPlayers, onAssign, onRemove, onClose }) {
  const { lang } = useSettings()
  const stat = (val) => val != null ? Number(val).toFixed(1) : '—'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 rounded-t-2xl max-h-[75vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <h3 className="text-white font-bold text-lg">
              {pos} Position
            </h3>
            <p className="text-gray-400 text-sm">
              {currentPlayer ? `Currently: ${getPlayerName(currentPlayer, lang)}` : 'Empty slot — pick a player'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl px-2">✕</button>
        </div>

        {/* Current player */}
        {currentPlayer && (
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3 bg-gray-900 rounded-xl p-3">
              <PlayerAvatar player={currentPlayer} size="md" />
              <div className="flex-1">
                <div className="text-white font-semibold">{getPlayerName(currentPlayer, lang)}</div>
                <div className="text-gray-400 text-xs">
                  {stat(currentPlayer.avg?.pts)} PTS · {stat(currentPlayer.avg?.reb)} REB · {stat(currentPlayer.avg?.ast)} AST
                </div>
              </div>
              <TierBadge tier={currentPlayer.tier} size="md" />
              <button
                onClick={() => { onRemove(pos); onClose() }}
                className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded-lg ml-1"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Bench list */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">
            {benchPlayers.length === 0 ? 'No bench players available' : 'Select from bench'}
          </p>
          <div className="flex flex-col gap-2">
            {benchPlayers.map(player => (
              <button
                key={player.id}
                onClick={() => { onAssign(pos, player); onClose() }}
                className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-xl p-3 text-left transition-colors w-full"
              >
                <PlayerAvatar player={player} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {getPlayerName(player, lang)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {player.avg?.teamAbbr ?? '—'} · {player.position || '—'} ·{' '}
                    {stat(player.avg?.pts)} PTS · {stat(player.avg?.reb)} REB · {stat(player.avg?.ast)} AST
                  </div>
                </div>
                <TierBadge tier={player.tier} size="sm" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
