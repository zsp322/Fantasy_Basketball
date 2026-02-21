import { getTierByName } from '../utils/tiers'

// ─────────────────────────────────────────────────────────────────────────────
// 2025 NBA Draft Rookie Class
// These players are EXCLUDED from the regular ESPN player pool.
// They are only obtainable via the Slot Machine (抽卡) feature.
// Salaries reflect real 2025-26 NBA rookie scale contracts.
// rookieLocked: true — cannot be sold until next season.
// ─────────────────────────────────────────────────────────────────────────────

function mkTier(name, realSalary) {
  return { ...getTierByName(name), salary: realSalary }
}

// Projected 2025-26 season stats (conservative first-year estimates)
export const ROOKIE_PLAYERS = [
  {
    id: 'rookie_001',
    first_name: 'Cooper', last_name: 'Flagg',
    position: 'SF', positions: ['SF', 'PF'],
    headshot: null,
    isRookie: true,
    rookieLocked: true,
    avg: { pts: 17, reb: 7.5, ast: 3.5, stl: 1.3, blk: 1.2,
           fg3m: 1.5, fgm: 6.5, fga: 14, fta: 3.5, to: 2.0, min: 30, pf: 2.0 },
    tier: mkTier('B+', 14),
    offenseRating: 117,
    defenseRating: 118,
    usagePossessions: 17.5,
  },
  {
    id: 'rookie_002',
    first_name: 'Dylan', last_name: 'Harper',
    position: 'PG', positions: ['PG', 'SG'],
    headshot: null,
    isRookie: true,
    rookieLocked: true,
    avg: { pts: 15, reb: 4, ast: 6, stl: 1.2, blk: 0.3,
           fg3m: 1.2, fgm: 5.5, fga: 13, fta: 4, to: 2.5, min: 28, pf: 2.2 },
    tier: mkTier('B+', 12),
    offenseRating: 113,
    defenseRating: 78,
    usagePossessions: 17.3,
  },
  {
    id: 'rookie_003',
    first_name: 'Ace', last_name: 'Bailey',
    position: 'SF', positions: ['SF', 'SG'],
    headshot: null,
    isRookie: true,
    rookieLocked: true,
    avg: { pts: 14, reb: 5, ast: 2, stl: 0.9, blk: 0.8,
           fg3m: 1.5, fgm: 5.5, fga: 14, fta: 3.5, to: 1.8, min: 27, pf: 2.1 },
    tier: mkTier('B', 11),
    offenseRating: 76,
    defenseRating: 90,
    usagePossessions: 17.3,
  },
  {
    id: 'rookie_004',
    first_name: 'VJ', last_name: 'Edgecombe',
    position: 'SG', positions: ['SG', 'SF'],
    headshot: null,
    isRookie: true,
    rookieLocked: true,
    avg: { pts: 10, reb: 3.5, ast: 2, stl: 1.5, blk: 0.4,
           fg3m: 1.0, fgm: 4, fga: 10, fta: 2, to: 1.5, min: 22, pf: 1.8 },
    tier: mkTier('B-', 10),
    offenseRating: 60,
    defenseRating: 100,
    usagePossessions: 12.4,
  },
  {
    id: 'rookie_005',
    first_name: 'Tre', last_name: 'Johnson',
    position: 'SG', positions: ['SG', 'PG'],
    headshot: null,
    isRookie: true,
    rookieLocked: true,
    avg: { pts: 13, reb: 3, ast: 2.5, stl: 0.8, blk: 0.3,
           fg3m: 1.8, fgm: 5, fga: 13, fta: 3, to: 1.5, min: 25, pf: 2.0 },
    tier: mkTier('B-', 9),
    offenseRating: 80,
    defenseRating: 64,
    usagePossessions: 15.8,
  },
  {
    id: 'rookie_006',
    first_name: 'Khaman', last_name: 'Maluach',
    position: 'C', positions: ['C'],
    headshot: null,
    isRookie: true,
    rookieLocked: true,
    avg: { pts: 8, reb: 7, ast: 1, stl: 0.5, blk: 2.0,
           fg3m: 0, fgm: 3.5, fga: 6, fta: 2, to: 1.0, min: 20, pf: 2.5 },
    tier: mkTier('B', 7),
    offenseRating: 55,
    defenseRating: 131,
    usagePossessions: 7.9,
  },
]

// Fast lookup set — used to exclude rookies from ESPN player pool
export const ROOKIE_IDS = new Set(ROOKIE_PLAYERS.map(p => p.id))
