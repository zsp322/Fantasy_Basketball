export const TIERS = [
  { name: 'S+', salary: 70,  floor: 58, ceiling: 83, slots: 4,   color: 'bg-purple-500 text-white' },
  { name: 'S',  salary: 60,  floor: 47, ceiling: 73, slots: 8,   color: 'bg-purple-400 text-white' },
  { name: 'S-', salary: 50,  floor: 38, ceiling: 63, slots: 12,  color: 'bg-purple-300 text-black' },
  { name: 'A+', salary: 42,  floor: 32, ceiling: 52, slots: 16,  color: 'bg-blue-500 text-white' },
  { name: 'A',  salary: 33,  floor: 25, ceiling: 43, slots: 20,  color: 'bg-blue-400 text-white' },
  { name: 'A-', salary: 27,  floor: 20, ceiling: 35, slots: 24,  color: 'bg-blue-300 text-black' },
  { name: 'B+', salary: 22,  floor: 15, ceiling: 28, slots: 28,  color: 'bg-teal-500 text-white' },
  { name: 'B',  salary: 17,  floor: 12, ceiling: 22, slots: 32,  color: 'bg-teal-400 text-black' },
  { name: 'B-', salary: 12,  floor: 8,  ceiling: 17, slots: 40,  color: 'bg-teal-300 text-black' },
  { name: 'C+', salary: 8,   floor: 5,  ceiling: 12, slots: 50,  color: 'bg-green-500 text-white' },
  { name: 'C',  salary: 6,   floor: 3,  ceiling: 8,  slots: 60,  color: 'bg-green-400 text-black' },
  { name: 'C-', salary: 3,   floor: 2,  ceiling: 6,  slots: 80,  color: 'bg-green-300 text-black' },
  { name: 'D+', salary: 2.5, floor: 1.3,ceiling: 4,  slots: 100, color: 'bg-gray-500 text-white' },
  { name: 'D',  salary: 1.7, floor: 0.8,ceiling: 3,  slots: 120, color: 'bg-gray-400 text-black' },
  { name: 'D-', salary: 1.2, floor: 0.5,ceiling: 2.5,slots: 150, color: 'bg-gray-300 text-black' },
  { name: 'F',  salary: 0.8, floor: 0.5,ceiling: 1.7,slots: Infinity, color: 'bg-gray-200 text-black' },
]

export function assignTiers(playersWithScores) {
  // Only rank players with meaningful minutes
  const qualified = playersWithScores
    .filter(p => (p.avg?.min ?? 0) >= 10)
    .sort((a, b) => b.fantasyScore - a.fantasyScore)

  const result = []
  let assigned = 0

  for (const tier of TIERS) {
    const limit = tier.slots === Infinity ? qualified.length : tier.slots
    const slice = qualified.slice(assigned, assigned + limit)
    slice.forEach(p => result.push({ ...p, tier }))
    assigned += slice.length
    if (assigned >= qualified.length) break
  }

  // Players with too few minutes get F tier
  playersWithScores
    .filter(p => (p.avg?.min ?? 0) < 10)
    .forEach(p => result.push({ ...p, tier: TIERS[TIERS.length - 1] }))

  return result
}

export function getTierByName(name) {
  return TIERS.find(t => t.name === name) ?? TIERS[TIERS.length - 1]
}

// ── Shared tier color helpers (single source of truth) ────────────────────────

/** Hex border color for inline styles */
export function getTierBorderColor(tierName) {
  if (!tierName) return '#374151'
  if (['S+', 'S', 'S-'].includes(tierName)) return '#a855f7'
  if (['A+', 'A', 'A-'].includes(tierName)) return '#60a5fa'
  if (['B+', 'B', 'B-'].includes(tierName)) return '#14b8a6'
  if (['C+', 'C', 'C-'].includes(tierName)) return '#4ade80'
  return '#6b7280'
}

/** rgba glow color for box-shadow */
export function getTierGlow(tierName) {
  if (!tierName) return 'transparent'
  if (['S+', 'S', 'S-'].includes(tierName)) return 'rgba(168,85,247,0.55)'
  if (['A+', 'A', 'A-'].includes(tierName)) return 'rgba(96,165,250,0.5)'
  if (['B+', 'B', 'B-'].includes(tierName)) return 'rgba(20,184,166,0.45)'
  if (['C+', 'C', 'C-'].includes(tierName)) return 'rgba(74,222,128,0.45)'
  return 'rgba(156,163,175,0.25)'
}

/** Tailwind border class for className-based styling */
export function getTierBorderClass(tierName) {
  if (!tierName) return 'border-gray-700'
  if (['S+', 'S', 'S-'].includes(tierName)) return 'border-purple-400'
  if (['A+', 'A', 'A-'].includes(tierName)) return 'border-blue-400'
  if (['B+', 'B', 'B-'].includes(tierName)) return 'border-teal-400'
  if (['C+', 'C', 'C-'].includes(tierName)) return 'border-green-400'
  return 'border-gray-600'
}

/**
 * Scan a tiered player array and record the min/max fantasyScore seen in each tier.
 * Result is saved to localStorage as 'fbball_tier_boundaries' by usePlayers.
 * Used by useSalaryChanges to detect over/under-performance.
 */
export function computeTierBoundaries(tieredPlayers) {
  const boundaries = {}
  for (const p of tieredPlayers) {
    if (!p.tier?.name || p.fantasyScore == null) continue
    const name = p.tier.name
    if (!boundaries[name]) {
      boundaries[name] = { minScore: p.fantasyScore, maxScore: p.fantasyScore }
    } else {
      if (p.fantasyScore < boundaries[name].minScore) boundaries[name].minScore = p.fantasyScore
      if (p.fantasyScore > boundaries[name].maxScore) boundaries[name].maxScore = p.fantasyScore
    }
  }
  return boundaries
}
