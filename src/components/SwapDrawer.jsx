import { useState } from 'react'
import PlayerAvatar from './PlayerAvatar'
import TierBadge from './TierBadge'
import { useSettings } from '../contexts/SettingsContext'
import { getPlayerName } from '../data/playerNames'
import { getPosMismatchMult } from '../utils/gameEngine'
import { T, t } from '../data/i18n'

export default function SwapDrawer({ pos, currentPlayer, benchPlayers, onAssign, onRemove, onSell, onClose }) {
  const { lang } = useSettings()
  const [showSellConfirm, setShowSellConfirm] = useState(false)

  const sellAmount = parseFloat(((currentPlayer?.tier?.salary ?? 0) * 0.8).toFixed(1))

  // Sort by effective ATK+DEF at this slot (penalty applied), descending
  const sortedBench = [...benchPlayers].sort((a, b) => {
    const pmA = getPosMismatchMult(a.position, pos, a.positions)
    const pmB = getPosMismatchMult(b.position, pos, b.positions)
    const effA = ((a.offenseRating ?? 0) + (a.defenseRating ?? 0)) * pmA
    const effB = ((b.offenseRating ?? 0) + (b.defenseRating ?? 0)) * pmB
    return effB - effA
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 rounded-t-2xl max-h-[75vh] flex flex-col">
        {/* Inner wrapper — position: relative so the sell confirm overlay can use absolute inset-0 */}
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div>
              <h3 className="text-white font-bold text-lg">
                {t(T.swapDrawer.positionLabel, lang, pos)}
              </h3>
              <p className="text-gray-400 text-sm">
                {currentPlayer
                  ? t(T.swapDrawer.currently, lang, getPlayerName(currentPlayer, lang))
                  : t(T.swapDrawer.emptySlot, lang)}
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
                  <div className="flex items-center gap-1.5">
                    <div className="text-white font-semibold">{getPlayerName(currentPlayer, lang)}</div>
                    <TierBadge tier={currentPlayer.tier} size="sm" />
                  </div>
                  <div className="text-xs mt-0.5 flex gap-2">
                    <span className="text-orange-400">{t(T.shared.atk, lang)} <span className="font-bold">{currentPlayer.offenseRating ?? 0}</span></span>
                    <span className="text-blue-400">{t(T.shared.def, lang)} <span className="font-bold">{currentPlayer.defenseRating ?? 0}</span></span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowSellConfirm(true)}
                    className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-2 py-1 rounded-lg"
                  >
                    {t(T.swapDrawer.sellBtn, lang)}
                  </button>
                  <button
                    onClick={() => { onRemove(pos); onClose() }}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded-lg"
                  >
                    {t(T.swapDrawer.removeBtn, lang)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bench list */}
          <div className="overflow-y-auto flex-1 px-4 py-3">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">
              {sortedBench.length === 0
                ? t(T.swapDrawer.noBench, lang)
                : t(T.swapDrawer.selectBench, lang)}
            </p>
            <div className="flex flex-col gap-2">
              {sortedBench.map(player => {
                const pm = getPosMismatchMult(player.position, pos, player.positions)
                const pen = Math.round((1 - pm) * 100)
                const severe = pen >= 35
                const mild = pen > 0 && !severe
                const effAtk = Math.round((player.offenseRating ?? 0) * pm)
                const effDef = Math.round((player.defenseRating ?? 0) * pm)

                return (
                  <button
                    key={player.id}
                    onClick={() => { onAssign(pos, player); onClose() }}
                    style={{
                      borderColor: severe ? '#7f1d1d' : mild ? '#78350f' : '#1f2937',
                      background: severe ? 'rgba(127,29,29,0.18)' : mild ? 'rgba(120,53,15,0.15)' : '#111827',
                    }}
                    className="flex items-center gap-3 hover:brightness-110 border rounded-xl p-3 text-left transition-all w-full"
                  >
                    <PlayerAvatar player={player} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <div className="text-white font-semibold text-sm truncate">
                          {getPlayerName(player, lang)}
                        </div>
                        {pen > 0 && (
                          <span className={`text-xs font-bold px-1 py-0.5 rounded shrink-0 ${severe ? 'bg-red-900/60 text-red-400' : 'bg-amber-900/60 text-amber-400'}`}>
                            {(player.positions ?? [player.position]).join('/')}→{pos} −{pen}%
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-orange-400">
                          {t(T.shared.atk, lang)}{' '}
                          <span className="font-bold">{effAtk}</span>
                          {pen > 0 && <span className="text-gray-600 ml-0.5">({player.offenseRating})</span>}
                        </span>
                        <span className="text-blue-400">
                          {t(T.shared.def, lang)}{' '}
                          <span className="font-bold">{effDef}</span>
                          {pen > 0 && <span className="text-gray-600 ml-0.5">({player.defenseRating})</span>}
                        </span>
                        <span className="text-gray-600">{(player.positions ?? [player.position]).join('/')}</span>
                      </div>
                    </div>
                    <TierBadge tier={player.tier} size="sm" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sell confirmation overlay */}
          {showSellConfirm && currentPlayer && (
            <div
              className="absolute inset-0 rounded-t-2xl flex flex-col items-center justify-center gap-5 px-8"
              style={{ background: 'rgba(3,7,18,0.97)', zIndex: 10 }}
            >
              <div className="text-white font-bold text-xl">
                {t(T.swapDrawer.sellConfirmTitle, lang)}
              </div>
              <div className="text-center">
                <div className="text-gray-200 text-base font-semibold mb-1">
                  {t(T.swapDrawer.sellConfirmMsg, lang, getPlayerName(currentPlayer, lang), sellAmount)}
                </div>
                <div className="text-green-400 text-sm">
                  {t(T.swapDrawer.sellRefund, lang, sellAmount)}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { onSell(currentPlayer.id); onClose() }}
                  className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  {t(T.swapDrawer.sellYes, lang)}
                </button>
                <button
                  onClick={() => setShowSellConfirm(false)}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors"
                >
                  {t(T.swapDrawer.sellCancel, lang)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
