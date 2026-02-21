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

export default function RadarChart({ avg, size = 120, radius = 38 }) {
  if (!avg) return null

  const cx = size / 2
  const cy = size / 2
  const R = radius
  const n = AXES.length
  const angles = AXES.map((_, i) => -90 + (i * 360) / n)

  function toPoints(level) {
    return angles.map(a => {
      const p = polar(cx, cy, R * level, a)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  const dataPoints = AXES.map((axis, i) => {
    const val = Math.min(Math.max((avg[axis.key] ?? 0) / axis.max, 0), 1)
    const p = polar(cx, cy, R * val, angles[i])
    return { x: p.x, y: p.y }
  })

  const labelPositions = AXES.map((axis, i) => {
    const p = polar(cx, cy, R * 1.42, angles[i])
    return { ...p, label: axis.label, val: (avg[axis.key] ?? 0).toFixed(1) }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((lv, i) => (
        <polygon key={i} points={toPoints(lv)} fill="none"
          stroke={lv === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
          strokeWidth="0.8" />
      ))}
      {angles.map((a, i) => {
        const outer = polar(cx, cy, R, a)
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
          stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      })}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(251,146,60,0.28)" stroke="rgba(251,146,60,0.9)"
        strokeWidth="1.5" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.2" fill="rgb(251,146,60)" />
      ))}
      {labelPositions.map((lp, i) => (
        <g key={i}>
          <text x={lp.x} y={lp.y - 3} textAnchor="middle"
            fill="rgba(200,200,200,0.85)" fontSize="7.5" fontWeight="600">
            {lp.label}
          </text>
          <text x={lp.x} y={lp.y + 6.5} textAnchor="middle"
            fill="rgba(251,146,60,0.95)" fontSize="7">
            {lp.val}
          </text>
        </g>
      ))}
    </svg>
  )
}
