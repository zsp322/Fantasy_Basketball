// Internal use only — drives tier assignment. Never display this in the UI.
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

// Offensive efficiency — True Shooting %, assist/turnover ratio, and 3pt threat
// Used in game simulation and player display
export function calcOffenseRating(avg) {
  if (!avg) return 0

  // True Shooting %: PTS / (2 * (FGA + 0.44 * FTA))
  // Graceful fallback: if no shot attempt data, estimate fga from pts
  const fga = (avg.fga > 0) ? avg.fga : (avg.pts / 1.5)
  const fta = avg.fta ?? 0
  const tsAttempts = fga + 0.44 * fta
  const ts = tsAttempts > 0.5 ? ((avg.pts ?? 0) / (2 * tsAttempts)) : 0.53

  // Assist-to-Turnover ratio (capped to prevent extreme outliers)
  const to = Math.max(avg.to ?? 0, 0.5)
  const astToRatio = Math.min((avg.ast ?? 0) / to, 4)

  const raw =
    ts * (avg.pts ?? 0) * 10.0 +    // quality-adjusted scoring
    (avg.ast ?? 0) * 5.0 +           // playmaking volume
    astToRatio * 6.5 +               // efficient playmaking bonus
    (avg.fg3m ?? 0) * 4.0 -          // 3pt threat
    (avg.to ?? 0) * 5.0              // turnover penalty

  return Math.max(0, Math.round(raw))
}

// Defensive impact — steals, blocks, and rebounding
// Used in game simulation and player display
export function calcDefenseRating(avg) {
  if (!avg) return 0
  const raw =
    (avg.stl ?? 0) * 31 +
    (avg.blk ?? 0) * 25 +
    (avg.reb ?? 0) * 4
  return Math.max(0, Math.round(raw))
}
