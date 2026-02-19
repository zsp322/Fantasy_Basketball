// 2015-16 Golden State Warriors — the 73-9 dynasty season
// Ratings pre-computed using calcOffenseRating / calcDefenseRating from scoring.js
//
// Bench substitution positions:
//   SG  → Shaun Livingston
//   SF  → Andre Iguodala
//   C   → Festus Ezeli

export const NPC_TEAM_NAME = '2015-16 Golden State Warriors'
export const NPC_TEAM_SHORT = '73-9 Dynasty'

export const npcStarters = [
  {
    id: 'npc_curry',
    first_name: 'Stephen',
    last_name: 'Curry',
    position: 'PG',
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/201939.png',
    avg: {
      pts: 30.1, fgm: 9.6,  fga: 19.4,
      fg3m: 5.1, fg3a: 11.7,
      ftm: 4.4,  fta: 4.9,
      ast: 6.7,  to: 3.3,
      stl: 2.1,  blk: 0.2, reb: 5.4,
      min: 34.2, gp: 79, teamAbbr: 'GSW',
    },
    offenseRating: 261,
    defenseRating: 115,
    tier: { name: 'S+', color: 'bg-purple-400', salary: 42 },
  },
  {
    id: 'npc_thompson',
    first_name: 'Klay',
    last_name: 'Thompson',
    position: 'SG',
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/202691.png',
    avg: {
      pts: 22.1, fgm: 8.4,  fga: 17.2,
      fg3m: 3.2, fg3a: 7.5,
      ftm: 1.8,  fta: 2.2,
      ast: 2.1,  to: 1.9,
      stl: 0.8,  blk: 0.5, reb: 3.8,
      min: 33.1, gp: 81, teamAbbr: 'GSW',
    },
    offenseRating: 155,
    defenseRating: 95,
    tier: { name: 'A+', color: 'bg-blue-400', salary: 25 },
  },
  {
    id: 'npc_barnes',
    first_name: 'Harrison',
    last_name: 'Barnes',
    position: 'SF',
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/203084.png',
    avg: {
      pts: 11.7, fgm: 4.3,  fga: 10.0,
      fg3m: 1.0, fg3a: 3.3,
      ftm: 2.0,  fta: 2.5,
      ast: 1.3,  to: 1.1,
      stl: 0.5,  blk: 0.5, reb: 5.0,
      min: 31.6, gp: 82, teamAbbr: 'GSW',
    },
    offenseRating: 74,
    defenseRating: 65,
    tier: { name: 'B+', color: 'bg-cyan-400', salary: 13 },
  },
  {
    id: 'npc_green',
    first_name: 'Draymond',
    last_name: 'Green',
    position: 'PF',
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/203110.png',
    avg: {
      pts: 14.0, fgm: 5.0,  fga: 10.3,
      fg3m: 1.8, fg3a: 5.2,
      ftm: 1.7,  fta: 2.8,
      ast: 7.4,  to: 3.0,
      stl: 1.5,  blk: 1.4, reb: 9.5,
      min: 35.3, gp: 81, teamAbbr: 'GSW',
    },
    offenseRating: 130,
    defenseRating: 175,
    tier: { name: 'A', color: 'bg-blue-300', salary: 20 },
  },
  {
    id: 'npc_bogut',
    first_name: 'Andrew',
    last_name: 'Bogut',
    position: 'C',
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/101106.png',
    avg: {
      pts: 6.5,  fgm: 2.8,  fga: 5.0,
      fg3m: 0,   fg3a: 0,
      ftm: 0.8,  fta: 1.3,
      ast: 1.7,  to: 0.9,
      stl: 0.5,  blk: 2.3, reb: 8.5,
      min: 24.1, gp: 67, teamAbbr: 'GSW',
    },
    offenseRating: 54,
    defenseRating: 152,
    tier: { name: 'B-', color: 'bg-cyan-300', salary: 7 },
  },
]

// Bench players — available for substitution when starters tire out
export const npcBench = [
  {
    id: 'npc_livingston',
    first_name: 'Shaun',
    last_name: 'Livingston',
    position: 'SG',  // covers Thompson's slot
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/2733.png',
    avg: {
      pts: 6.3,  fgm: 2.8, fga: 5.3,
      fg3m: 0,   fg3a: 0,
      ftm: 0.7,  fta: 1.1,
      ast: 2.5,  to: 1.1,
      stl: 0.6,  blk: 0.2, reb: 2.3,
      min: 20.6, gp: 75, teamAbbr: 'GSW',
    },
    offenseRating: 56,
    defenseRating: 58,
    tier: { name: 'C+', color: 'bg-green-400', salary: 5 },
  },
  {
    id: 'npc_iguodala',
    first_name: 'Andre',
    last_name: 'Iguodala',
    position: 'SF',  // covers Barnes's slot
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/2738.png',
    avg: {
      pts: 7.6,  fgm: 3.1, fga: 7.0,
      fg3m: 1.0, fg3a: 2.6,
      ftm: 0.6,  fta: 0.9,
      ast: 3.4,  to: 1.3,
      stl: 1.7,  blk: 0.6, reb: 4.0,
      min: 25.8, gp: 76, teamAbbr: 'GSW',
    },
    offenseRating: 71,
    defenseRating: 130,
    tier: { name: 'B+', color: 'bg-cyan-400', salary: 13 },
  },
  {
    id: 'npc_ezeli',
    first_name: 'Festus',
    last_name: 'Ezeli',
    position: 'C',   // covers Bogut's slot
    headshot: 'https://cdn.nba.com/headshots/nba/latest/260x190/203486.png',
    avg: {
      pts: 4.1,  fgm: 1.7, fga: 3.3,
      fg3m: 0,   fg3a: 0,
      ftm: 0.8,  fta: 1.4,
      ast: 0.4,  to: 0.8,
      stl: 0.5,  blk: 0.5, reb: 3.8,
      min: 13.3, gp: 55, teamAbbr: 'GSW',
    },
    offenseRating: 23,
    defenseRating: 68,
    tier: { name: 'C', color: 'bg-green-300', salary: 3 },
  },
]
