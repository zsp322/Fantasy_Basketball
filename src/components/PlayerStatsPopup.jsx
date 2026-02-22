import ReactDOM from 'react-dom'
import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'
import { getPlayerName } from '../data/playerNames'
import RadarChart from './RadarChart'

export default function PlayerStatsPopup({ player, rect }) {
  const { lang } = useSettings()
  if (!player || !rect) return null

  const POPUP_W = 270
  const POPUP_H = 200

  // Smart positioning: prefer right of card, fallback to left
  let x = rect.right + 10
  let y = rect.top - 10
  if (x + POPUP_W > window.innerWidth - 8) x = rect.left - POPUP_W - 10
  if (y + POPUP_H > window.innerHeight - 8) y = window.innerHeight - POPUP_H - 8
  if (y < 8) y = 8

  const avg = player.avg
  const stat = v => (v != null ? Number(v).toFixed(1) : '—')
  const tierName = player.tier?.name

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: POPUP_W,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        className="rounded-xl border border-gray-700/70 overflow-hidden"
        style={{
          background: 'rgba(8,10,20,0.96)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header: photo + name + tier */}
        <div className="flex items-center gap-2.5 p-3 pb-2 border-b border-gray-800/60">
          {player.headshot ? (
            <img
              src={player.headshot}
              alt={player.last_name}
              className="rounded-lg object-cover object-top flex-shrink-0"
              style={{ width: 48, height: 52 }}
            />
          ) : (
            <div
              className="rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 bg-gray-800"
              style={{ width: 48, height: 52 }}
            >
              {player.first_name?.[0]}{player.last_name?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm leading-tight">
              {getPlayerName(player, lang)}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              {[avg?.teamAbbr, player.position || '—'].filter(Boolean).join(' · ')}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${player.tier?.color ?? 'bg-gray-500 text-white'}`}>
                {tierName}
              </span>
              <span className="text-green-400 text-xs font-bold">${player.tier?.salary}M</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 flex flex-col gap-1">
            <div>
              <div className="text-orange-400 font-bold text-base leading-tight">{player.offenseRating ?? '—'}</div>
              <div className="text-gray-500 text-xs">{t(T.shared.atk, lang)}</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold text-base leading-tight">{player.defenseRating ?? '—'}</div>
              <div className="text-gray-500 text-xs">{t(T.shared.def, lang)}</div>
            </div>
          </div>
        </div>

        {/* Body: radar + stat row */}
        <div className="flex items-center gap-1 px-2 py-2">
          <RadarChart avg={avg} />

          <div className="flex flex-col gap-1.5 flex-1">
            {[
              { key: 'PTS', label: t(T.shared.pts, lang), value: stat(avg?.pts), color: 'text-orange-300' },
              { key: 'REB', label: t(T.shared.reb, lang), value: stat(avg?.reb), color: 'text-blue-300' },
              { key: 'AST', label: t(T.shared.ast, lang), value: stat(avg?.ast), color: 'text-green-300' },
              { key: 'STL', label: t(T.shared.stl, lang), value: stat(avg?.stl), color: 'text-yellow-300' },
              { key: 'BLK', label: t(T.shared.blk, lang), value: stat(avg?.blk), color: 'text-purple-300' },
              { key: 'TO',  label: t(T.shared.to,  lang), value: stat(avg?.to),  color: 'text-red-400' },
            ].map(({ key, label, value, color }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-500 text-xs w-7">{label}</span>
                <div className="flex-1 mx-1.5 bg-gray-800 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${color.replace('text-', 'bg-')}`}
                    style={{
                      width: `${Math.min(
                        (Number(value) / ({ PTS: 35, REB: 15, AST: 12, STL: 3, BLK: 3.5, TO: 5 }[key] ?? 10)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span className={`text-xs font-semibold w-7 text-right ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
