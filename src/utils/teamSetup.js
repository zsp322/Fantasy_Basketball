import { TIERS } from './tiers'

const S_TIERS = ['S+', 'S', 'S-']
const MAX_START_TIER = 'A' // auto-assigned players max this tier
const MAX_START_TIER_IDX = TIERS.findIndex(t => t.name === MAX_START_TIER)
const AUTO_ASSIGN_COUNT = 7
export const STARTING_CASH = 50    // $50M
export const SALARY_CAP    = 200   // $200M

export function getSPlayers(allPlayers) {
  return allPlayers.filter(p => S_TIERS.includes(p.tier?.name))
}

export function autoAssignPlayers(allPlayers, excludeIds = []) {
  // Pool: tiers A and below (index >= MAX_START_TIER_IDX), with real stats
  const pool = allPlayers.filter(p => {
    const idx = TIERS.findIndex(t => t.name === p.tier?.name)
    return idx >= MAX_START_TIER_IDX && !excludeIds.includes(p.id) && p.avg
  })

  // Shuffle and pick AUTO_ASSIGN_COUNT
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, AUTO_ASSIGN_COUNT)
}
