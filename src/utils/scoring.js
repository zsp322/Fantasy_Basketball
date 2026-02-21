const EXACT_POS = new Set(['PG', 'SG', 'SF', 'PF', 'C'])

// Maps raw ESPN position abbreviations (G, F, G/F, PF/C, etc.) to one of the
// five standard slots. Uses player height (inches) as a tiebreaker for generic
// G / F entries. Returns the PRIMARY (single) position.
export function resolvePosition(rawPos, heightInches) {
  if (!rawPos) return 'SF'
  if (EXACT_POS.has(rawPos)) return rawPos
  const h = heightInches ?? 78 // default 6'6" if unknown
  const primary = rawPos.split('/')[0].trim()
  if (EXACT_POS.has(primary)) return primary
  if (primary === 'G') return h < 77 ? 'PG' : 'SG'  // split at 6'5"
  if (primary === 'F') return h < 81 ? 'SF' : 'PF'  // split at 6'9"
  return 'SF'
}

// Returns ALL eligible positions for a player (e.g. 'G/F' → ['PG','SG','SF','PF']).
// Used to allow multi-position players to fill any of their natural slots without penalty.
export function resolveEligiblePositions(rawPos) {
  if (!rawPos) return ['SF']
  if (EXACT_POS.has(rawPos)) return [rawPos]

  // Generic single — eligible for both adjacent slots
  if (rawPos === 'G') return ['PG', 'SG']
  if (rawPos === 'F') return ['SF', 'PF']
  if (rawPos === 'C') return ['C']

  // Dual/multi strings like 'G/F', 'SF/PF', 'PF/C', 'PG/SG' …
  const parts = rawPos.split('/').map(s => s.trim())
  const result = []
  for (const p of parts) {
    if (EXACT_POS.has(p))  result.push(p)
    else if (p === 'G')    result.push('PG', 'SG')
    else if (p === 'F')    result.push('SF', 'PF')
    else if (p === 'C')    result.push('C')
  }
  return [...new Set(result)] // deduplicate, preserve order
}

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

// Offensive efficiency — True Shooting %, EFG% premium, assist/turnover ratio, 3pt threat
// Used in game simulation and player display
export function calcOffenseRating(avg) {
  if (!avg) return 0

  // True Shooting %: PTS / (2 * (FGA + 0.44 * FTA))
  // Graceful fallback: if no shot attempt data, estimate fga from pts
  const fga = (avg.fga > 0) ? avg.fga : (avg.pts / 1.5)
  const fta = avg.fta ?? 0
  const tsAttempts = fga + 0.44 * fta
  const ts = tsAttempts > 0.5 ? ((avg.pts ?? 0) / (2 * tsAttempts)) : 0.53

  // Effective FG%: (FGM + 0.5 * FG3M) / FGA — rewards efficient shooters above 50% EFG
  const fgm = avg.fgm ?? 0
  const efg = fga > 0 ? (fgm + 0.5 * (avg.fg3m ?? 0)) / fga : 0.50
  const efgPremium = Math.max(0, efg - 0.50) * (avg.pts ?? 0) * 2.5

  // Assist-to-Turnover ratio (capped to prevent extreme outliers)
  const to = Math.max(avg.to ?? 0, 0.5)
  const astToRatio = Math.min((avg.ast ?? 0) / to, 4)

  const raw =
    ts * (avg.pts ?? 0) * 10.0 +    // quality-adjusted scoring volume
    efgPremium +                      // shooting efficiency bonus above league avg
    (avg.ast ?? 0) * 5.0 +           // playmaking volume
    astToRatio * 6.5 +               // efficient playmaking bonus
    (avg.fg3m ?? 0) * 3.0 -          // 3pt threat (reduced; EFG premium handles quality)
    (avg.to ?? 0) * 5.0              // turnover penalty

  return Math.max(0, Math.round(raw))
}

// Possessions used per game — proxy for Usage %.
// Formula: FGA + 0.44×FTA + TO  (standard NBA USG numerator, no team denominator needed)
// Used to weight attacker selection in the game engine so high-usage players get the ball more.
export function calcUsagePossessions(avg) {
  if (!avg) return 0
  return Math.max(0, (avg.fga ?? 0) + 0.44 * (avg.fta ?? 0) + (avg.to ?? 0))
}

// Defensive impact — steals, blocks, rebounding (per-36 normalized) + court-time bonus - foul penalty
// Per-36 normalization equalizes bench players vs starters; capped at 1.5× for <15-min players.
// Court-time bonus (min × 0.7): coaches play players they trust defensively — more minutes ≈ more defensive value.
// Used in game simulation and player display
export function calcDefenseRating(avg) {
  if (!avg) return 0
  const min = Math.max(avg.min ?? 20, 5)
  const norm = Math.min(36 / min, 1.5)
  const raw =
    (avg.stl ?? 0) * norm * 27 +   // steals per 36 (best per-possession defensive indicator)
    (avg.blk ?? 0) * norm * 25 +   // blocks per 36
    (avg.reb ?? 0) * norm * 3.0 +  // rebounding per 36
    min * 0.7 -                     // court-time bonus: playing time reflects coaching trust
    (avg.pf  ?? 2.5) * 4.0         // personal foul penalty (undisciplined defense)
  return Math.max(0, Math.round(raw))
}
