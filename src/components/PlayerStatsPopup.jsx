import ReactDOM from 'react-dom'

// Radar chart axes and their rough max values for normalization
const AXES = [
  { key: 'pts', label: 'PTS', max: 35 },
  { key: 'ast', label: 'AST', max: 12 },
  { key: 'blk', label: 'BLK', max: 3.5 },
  { key: 'stl', label: 'STL', max: 3 },
  { key: 'reb', label: 'REB', max: 15 },
]

function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function RadarChart({ avg }) {
  if (!avg) return null

  const SIZE = 120
  const cx = SIZE / 2
  const cy = SIZE / 2
  const R = 38
  const n = AXES.length

  // evenly spaced angles, start from top (-90°)
  const angles = AXES.map((_, i) => -90 + (i * 360) / n)

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  function toPoints(level) {
    return angles
      .map(a => {
        const p = polar(cx, cy, R * level, a)
        return `${p.x},${p.y}`
      })
      .join(' ')
  }

  const dataPoints = AXES.map((axis, i) => {
    const val = Math.min(Math.max((avg[axis.key] ?? 0) / axis.max, 0), 1)
    const p = polar(cx, cy, R * val, angles[i])
    return { x: p.x, y: p.y, rawVal: (avg[axis.key] ?? 0).toFixed(1) }
  })

  const labelPositions = AXES.map((axis, i) => {
    const p = polar(cx, cy, R * 1.42, angles[i])
    return { ...p, label: axis.label, val: (avg[axis.key] ?? 0).toFixed(1) }
  })

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* Grid rings */}
      {gridLevels.map((lv, i) => (
        <polygon
          key={i}
          points={toPoints(lv)}
          fill="none"
          stroke={lv === 1.0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
          strokeWidth="0.8"
        />
      ))}

      {/* Axis spokes */}
      {angles.map((a, i) => {
        const outer = polar(cx, cy, R, a)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.8"
          />
        )
      })}

      {/* Data fill */}
      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(251,146,60,0.28)"
        stroke="rgba(251,146,60,0.9)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Dots on data */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.2" fill="rgb(251,146,60)" />
      ))}

      {/* Axis labels + values */}
      {labelPositions.map((lp, i) => (
        <g key={i}>
          <text
            x={lp.x} y={lp.y - 3}
            textAnchor="middle"
            fill="rgba(200,200,200,0.85)"
            fontSize="7.5"
            fontWeight="600"
          >
            {lp.label}
          </text>
          <text
            x={lp.x} y={lp.y + 6.5}
            textAnchor="middle"
            fill="rgba(251,146,60,0.95)"
            fontSize="7"
          >
            {lp.val}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function PlayerStatsPopup({ player, rect }) {
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
              {player.first_name} {player.last_name}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              {avg?.teamAbbr ?? '—'} · {player.position || '—'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${player.tier?.color ?? 'bg-gray-500 text-white'}`}
              >
                {tierName}
              </span>
              <span className="text-green-400 text-xs font-bold">${player.tier?.salary}M</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 flex flex-col gap-1">
            <div>
              <div className="text-orange-400 font-bold text-base leading-tight">{player.offenseRating ?? '—'}</div>
              <div className="text-gray-500 text-xs">ATK</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold text-base leading-tight">{player.defenseRating ?? '—'}</div>
              <div className="text-gray-500 text-xs">DEF</div>
            </div>
          </div>
        </div>

        {/* Body: radar + stat row */}
        <div className="flex items-center gap-1 px-2 py-2">
          <RadarChart avg={avg} />

          {/* Extra stats on the right */}
          <div className="flex flex-col gap-1.5 flex-1">
            {[
              { label: 'PTS', value: stat(avg?.pts), color: 'text-orange-300' },
              { label: 'REB', value: stat(avg?.reb), color: 'text-blue-300' },
              { label: 'AST', value: stat(avg?.ast), color: 'text-green-300' },
              { label: 'STL', value: stat(avg?.stl), color: 'text-yellow-300' },
              { label: 'BLK', value: stat(avg?.blk), color: 'text-purple-300' },
              { label: 'TO',  value: stat(avg?.to),  color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-500 text-xs w-7">{label}</span>
                <div className="flex-1 mx-1.5 bg-gray-800 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${color.replace('text-', 'bg-')}`}
                    style={{
                      width: `${Math.min(
                        (Number(value) /
                          ({ PTS: 35, REB: 15, AST: 12, STL: 3, BLK: 3.5, TO: 5 }[label] ?? 10)) *
                          100,
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
