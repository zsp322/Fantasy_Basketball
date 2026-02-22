// ─── Offensive schemes ────────────────────────────────────────────────────────
export const OFFENSE_SCHEMES = {
  isolation: {
    id: 'isolation',
    usageTopMult: 3.0,   // star player usage weight ×3
    usageFlat:    false,
    astMult:      0.70,  // fewer assists — one player doing it all
    force3Rate:   false,
  },
  ballMovement: {
    id: 'ballMovement',
    usageTopMult: 1.0,
    usageFlat:    true,  // everyone equally likely to get the ball
    astMult:      1.40,  // high assist rate — ball moves, everyone involved
    force3Rate:   false,
  },
  threeHeavy: {
    id: 'threeHeavy',
    usageTopMult: 1.0,
    usageFlat:    false,
    astMult:      1.00,
    force3Rate:   true,  // weight attackers by 3PA; convert some 2pt attempts → 3pt
  },
}

// ─── Defensive schemes ────────────────────────────────────────────────────────
export const DEFENSE_SCHEMES = {
  manToMan: {
    id: 'manToMan',
    mismatchMult:    1.0,   // full position-mismatch penalty applied to defender
    useTeamDef:      false, // individual defender rating used
    oppToMult:       1.0,   // no TO boost
    energyDrainMult: 1.0,   // normal energy drain for defenders
  },
  zone: {
    id: 'zone',
    mismatchMult:    0.5,   // positional mismatch matters less — zone collapses coverage
    useTeamDef:      true,  // use team-average defense instead of individual matchup
    oppToMult:       1.0,
    energyDrainMult: 1.0,
  },
  pressure: {
    id: 'pressure',
    mismatchMult:    1.0,
    useTeamDef:      false,
    oppToMult:       1.25,  // full-court press → opponent turns it over 25% more often
    energyDrainMult: 1.15,  // defenders drain 15% faster from aggressive play
  },
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_SCHEMES = { offense: 'isolation', defense: 'manToMan' }
export const SCHEME_STORAGE_KEY = 'fbball_schemes'

// ─── Persistence helpers ──────────────────────────────────────────────────────
export function loadSchemes() {
  try {
    const raw = localStorage.getItem(SCHEME_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SCHEMES }
    const parsed = JSON.parse(raw)
    return {
      offense: OFFENSE_SCHEMES[parsed.offense] ? parsed.offense : DEFAULT_SCHEMES.offense,
      defense: DEFENSE_SCHEMES[parsed.defense] ? parsed.defense : DEFAULT_SCHEMES.defense,
    }
  } catch {
    return { ...DEFAULT_SCHEMES }
  }
}

export function saveSchemes(schemes) {
  localStorage.setItem(SCHEME_STORAGE_KEY, JSON.stringify(schemes))
}

// ─── Safe getters ─────────────────────────────────────────────────────────────
export function getOffenseScheme(id) {
  return OFFENSE_SCHEMES[id] ?? OFFENSE_SCHEMES[DEFAULT_SCHEMES.offense]
}

export function getDefenseScheme(id) {
  return DEFENSE_SCHEMES[id] ?? DEFENSE_SCHEMES[DEFAULT_SCHEMES.defense]
}

// ─── NPC AI: choose scheme based on game state ────────────────────────────────
// Pure function — called by game engine at each quarter boundary.
// Warriors-specific logic: default isolation through Curry, 3-heavy when fresh
// and early, ball movement when safely ahead, pressure when desperate late.
//
// @param {object} gameState
// @param {number} gameState.myScore
// @param {number} gameState.npcScore
// @param {number} gameState.quarter       1-4, 5+ = OT
// @param {number} gameState.npcAvgEnergy  0-100
// @returns {{ offense: string, defense: string }}
export function evaluateNpcScheme({ myScore, npcScore, quarter, npcAvgEnergy }) {
  const lead   = npcScore - myScore
  const isLate = quarter >= 4

  // Defense priority:
  //   • up big (>10) or team tired (<50 avg energy) → zone to conserve
  //   • down late (< -8 in Q4+) → pressure to force turnovers
  //   • otherwise → standard man-to-man
  let defense
  if (lead > 10 || npcAvgEnergy < 50) {
    defense = 'zone'
  } else if (lead < -8 && isLate) {
    defense = 'pressure'
  } else {
    defense = 'manToMan'
  }

  // Offense priority:
  //   • down badly (< -10) → isolation, give it to the star
  //   • up big (>15) → ball movement, run clock, preserve energy
  //   • early game (Q1/Q2) and fresh → 3-point heavy (Warriors identity)
  //   • default → isolation through Curry
  let offense
  if (lead < -10) {
    offense = 'isolation'
  } else if (lead > 15) {
    offense = 'ballMovement'
  } else if (quarter <= 2 && npcAvgEnergy > 75) {
    offense = 'threeHeavy'
  } else {
    offense = 'isolation'
  }

  return { offense, defense }
}
