import { TIERS } from './tiers'

const S_TIERS = ['S+', 'S', 'S-']
const MAX_START_TIER = 'A' // auto-assigned players max this tier
const MAX_START_TIER_IDX = TIERS.findIndex(t => t.name === MAX_START_TIER)
const AUTO_ASSIGN_COUNT = 7
export const STARTING_CASH = 50    // $50M
export const SALARY_CAP    = 200   // $200M

export function getSPlayers(allPlayers) {
  // Exclude S+ — only S and S- are available as foundation picks
  const pool = allPlayers.filter(p => ['S', 'S-'].includes(p.tier?.name))
  // Return 5 random picks for the user to choose from
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 5)
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
