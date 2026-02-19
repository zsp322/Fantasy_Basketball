export function calcFantasyScore(avg) {
  if (!avg) return 0
  return (
    (avg.pts  ?? 0) +
    (avg.reb  ?? 0) * 1.2 +
    (avg.ast  ?? 0) * 1.5 +
    (avg.stl  ?? 0) * 3 +
    (avg.blk  ?? 0) * 3 -
    (avg.to   ?? 0) +
    (avg.fg3m ?? 0) * 0.5
  )
}
