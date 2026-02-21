# Fantasy Basketball — Game Design Document

Last updated: 2026-02-19

---

## 1. Game Structure

| Parameter | Value |
|---|---|
| Quarters | 4 |
| Possessions per team per quarter | 20 |
| Total possessions per team | 80 |
| Total play events | ~160 (plus substitution events) |

Each quarter runs 20 full "rounds". A round = one my-team attack + one NPC attack (2 play events). Teams alternate possession within each round. No overtime is implemented.

---

## 2. Player Ratings

Ratings are pre-computed from real season averages using:

```
offenseRating = pts * 5.0 + ast * 4.0 + fg3m * 3.0 + (fgm/fga) * 20 + (ftm/fta) * 10
defenseRating = stl * 31 + blk * 25 + reb * 4
```

These are fixed per player and used as base inputs to the matchup formula. NPC Warriors ratings have been manually adjusted upward to reflect their historically elite 2015-16 defensive system beyond what raw counting stats capture.

---

## 3. Energy System

### Drain Rate
Each player has a personal drain rate based on average minutes per game:

```
drainRate = max(0.55, 2.5 − (avg.min / 40) × 2.0)
```

| avg.min | drainRate |
|---|---|
| 38 | ~0.55 (iron man) |
| 30 | ~1.00 |
| 20 | ~1.50 (limited minutes bench player) |

### Per-Possession Drain

| Role | Base drain |
|---|---|
| Attacker | drainRate × 2.5 |
| Defender | drainRate × 2.0 |
| Others on court (passive) | 0.3 |

Additional drain on top of base for the active player:

| Event | Attacker extra | Defender extra |
|---|---|---|
| Made field goal | + drainRate × 2.0 | — |
| Turnover | + drainRate × 1.0 | — |
| Steal or block against them | + drainRate × 1.5 | — |
| Steal | — | + drainRate × 3.0 |
| Block | — | + drainRate × 3.0 |

### Energy Multiplier

| Energy | Multiplier | Status |
|---|---|---|
| ≥ 70% | 1.00 | Full strength |
| 50–69% | 0.85 | Getting winded |
| 30–49% | 0.68 | Noticeably tired |
| < 30% | 0.50 | Gassed |

### Visual display
- Energy bar on each player card: green ≥70%, yellow ≥50%, orange ≥30%, red <30%
- Cards fade to 55% opacity when a player is gassed (<30%)

---

## 4. Shot Selection

Each possession, the attacker's shot type is drawn probabilistically:

```
fg3Rate = fg3a / fga                    (e.g. Curry: 11.7/19.4 ≈ 0.60)
ftRate  = fta / fga × 0.35              (drive/contact tendency)

r = random()
if r < fg3Rate:   shotType = '3pt'
elif r < fg3Rate + ftRate: shotType = 'FT'
else:             shotType = '2pt'
```

This preserves each player's real shooting profile — Curry fires 3s at a 60% rate, Bogut almost never takes one.

---

## 5. Matchup Formula

### Base shooting chance
```
3pt:  fg3m / fg3a   (player's real 3pt%)
2pt:  (fgm - fg3m) / (fga - fg3a)
FT:   ftm / fta
```

### Matchup adjustment
```
atkPower = offenseRating × atkEnergyMult × atkPosMult × rand(0.7, 1.3)
defPower = defenseRating × defEnergyMult × defPosMult × rand(0.7, 1.3)

matchupAdj = atkPower / (atkPower + defPower × 0.55)
```

The `0.55` defense weight means defense is impactful but not overwhelming. Elite defenders like Draymond Green (DEF 175) against an average attacker (ATK 100) produce a matchupAdj of ~0.51, which when combined with the base chance creates a realistic shooting suppression.

### Final hit chance
```
3pt: clamp(baseChance × matchupAdj × 1.10,  0.15, 0.55)
2pt: clamp(baseChance × matchupAdj × 1.45,  0.20, 0.80)
FT:  clamp(ftChance × sqrt(posMult),         0.45, 0.95)
```

---

## 6. Position Mismatch

When a player occupies a position slot outside their natural position, both their offensive and defensive ratings are penalized multiplicatively.

Position index: PG=0, SG=1, SF=2, PF=3, C=4

| Distance between natural and slot | Multiplier | Example |
|---|---|---|
| 0 | 1.00 (none) | PG playing PG |
| 1 | 0.85 (−15%) | PG playing SG |
| 2 | 0.65 (−35%) | PG playing SF |
| 3 | 0.45 (−55%) | PG playing PF |
| 4 | 0.20 (−80%) | PG playing C |

Mismatch also increases turnover probability:
```
toBoost = 1 + (1 - atkPosMult) × 2.0
```
A center playing point guard (mismatch mult = 0.20) will turn it over 2.6× more often than normal.

### Visual indicators on Simulate page
- No mismatch: normal tier-colored border
- diff=1 (amber): `"PG→SG −15%"` badge at bottom of card, amber border
- diff≥2 (red): `"PG→SF −35%"` badge, red border, red glow

---

## 7. Special Events

Checked per possession after turnover check:

| Event | Probability formula | Effect |
|---|---|---|
| Turnover | `avg.to × 0.042 × toBoost` | Possession ends, no shot |
| Steal | `defender.avg.stl × defPosMult × 0.12` (on turnover) | Tagged to defender |
| Block | `defender.avg.blk × defPosMult × 0.07` (on missed FG) | Tagged to defender |
| Off-reb | `attacker.avg.reb × 0.03` (on miss, no block) | Tagged to attacker |
| Assist | 60% chance on any made field goal | Random teammate |

---

## 8. NPC Substitutions

At the **end of each quarter** (not quarter 4), the NPC Warriors auto-sub any tired player:

- If a starter's energy < **38%** at quarter end → search bench for same-position replacement
- Sub-in player starts at **100%** energy (fresh legs)
- Sub events appear in the play log as `"SUB (GSW): Iguodala in for Barnes (32% energy)"`

### Bench coverage
| Starter | Backup | Position |
|---|---|---|
| Klay Thompson (SG) | Shaun Livingston (SG) | Guard |
| Harrison Barnes (SF) | Andre Iguodala (SF) | Wing |
| Andrew Bogut (C) | Festus Ezeli (C) | Big |

Curry and Draymond have no direct bench backup (they play full games in the simulation).

---

## 9. Human Substitutions (mid-game)

The user can substitute their own players during the game:
1. **Pause** the animation (⏸ button)
2. **Click** any starter card on the left column
3. A panel shows bench options with their ATK/DEF ratings and position mismatch penalty
4. On selection, `resumeSimulation()` is called — it keeps all plays up to the pause point, then re-simulates the remainder with the new lineup using the current score and energy snapshots
5. The sub-in player starts with **80%** energy (fresh bench player boost)
6. Animation auto-resumes after swap

---

## 10. Pause System

- User clicks ⏸ Pause → animation stops
- A **10-second countdown** begins
- At 0, game auto-resumes
- Clicking ▶ Resume at any time cancels the countdown and resumes immediately
- The pause is the window for human substitutions

---

## 11. Attacker / Defender Selection

Each possession:

**Attacker**: weighted random from 5 active players
```
weight = (offenseRating + 100) × energyMultiplier
```
Stars with high offense ratings get the ball more, but fatigued stars get fewer opportunities.

**Defender**: 80% chance the positionally matched defender guards (e.g., Curry guards the opposing PG). 20% chance a random defender is picked by defensive weight:
```
weight = (defenseRating + 80) × energyMultiplier
```

---

## 12. Box Score

Accumulated per player during simulation:

| Stat | Trigger |
|---|---|
| PTS | Points scored (FT or FG) |
| REB | 70% chance on any miss not stolen, plus off-reb events |
| AST | 60% chance when a teammate scores a field goal |
| STL | steal events (defender) |
| BLK | block events (defender) |
| TO | turnover events (attacker) |
| FGA/FGM | field goal attempts/makes |
| 3PA/3PM | 3-point attempts/makes |
| FTA/FTM | free throw attempts/makes |

---

## 13. NPC Team — 2015-16 Golden State Warriors

73-9 regular season, the greatest single-season NBA team by win record.

| Player | Pos | ATK | DEF | Role |
|---|---|---|---|---|
| Stephen Curry | PG | 261 | 115 | MVP, all-time shooter |
| Klay Thompson | SG | 155 | 95 | Splash Brother, perimeter lockdown |
| Harrison Barnes | SF | 74 | 65 | Role player, wing |
| Draymond Green | PF | 130 | 175 | DPOY, system anchor |
| Andrew Bogut | C | 54 | 152 | Rim protector, 2.3 BPG |
| Shaun Livingston | SG | 56 | 58 | Backup guard |
| Andre Iguodala | SF | 71 | 130 | 2015 Finals MVP, defensive stopper |
| Festus Ezeli | C | 23 | 68 | Backup big |

---

## 14. Player Economy — Salary & Tier Movement

### Philosophy

Salary and tier are two separate things that move at different speeds:

- **Salary** drifts daily within the tier's band. Small, frequent, visible.
- **Tier** changes slowly and only after sustained over/under-performance. Rare, meaningful.

A player like LeBron having one bad game does nothing. Ten consecutive bad games reflected in his season averages nudge him down within his tier first. If it continues long enough, he drops from S to S-.

---

### Salary Bands

Each tier in `tiers.js` already defines a salary band via `floor` and `ceiling` ($M):

| Tier | Floor  | Ceiling | Default (midpoint) |
|------|--------|---------|--------------------|
| S+   | $58M   | $83M    | $70M               |
| S    | $47M   | $73M    | $60M               |
| S-   | $38M   | $63M    | $50M               |
| A+   | $32M   | $52M    | $42M               |
| A    | $25M   | $43M    | $33M               |
| A-   | $20M   | $35M    | $27M               |
| B+   | $15M   | $28M    | $22M               |
| B    | $12M   | $22M    | $17M               |
| B-   | $8M    | $17M    | $12M               |
| C+   | $5M    | $12M    | $8M                |
| C    | $3M    | $8M     | $6M                |
| C-   | $2M    | $6M     | $3M                |
| D+   | $1.3M  | $4M     | $2.5M              |
| D    | $0.8M  | $3M     | $1.7M              |
| D-   | $0.5M  | $2.5M   | $1.2M              |
| F    | $0.5M  | $1.7M   | $0.8M              |

A player's salary **never crosses** their tier's floor or ceiling. Boundary crossing only happens via a tier change event.

---

### Tier Score Boundaries

Tiers are slot-based (top 4 players → S+, next 8 → S, etc.). After each `assignTiers()` run, the system records the `fantasyScore` range seen in each tier:

```
tierBoundaries = {
  'S+': { minScore: 310, maxScore: 430 },
  'S':  { minScore: 245, maxScore: 309 },
  ...
}
```

Stored in `fbball_tier_boundaries` (localStorage). Refreshed whenever the player cache refreshes (same cadence as ESPN data).

These boundaries are the reference point for deciding if a player is over/under-performing their tier.

---

### Per-Player Salary State

Stored in `fbball_salary_state_v1` (localStorage):

```js
{
  [playerId]: {
    salary: float,              // current salary ($M)
    tierName: string,           // current tier ('S', 'A+', etc.)
    overperformDays: int,       // consecutive days fantasyScore > tier boundary max
    underperformDays: int,      // consecutive days fantasyScore < tier boundary min
    lastUpdatedDate: string,    // 'YYYY-MM-DD' — prevents double-updating in one day
  }
}
```

---

### Daily Salary Drift (within tier)

Runs once per calendar day. Two components combined:

**1. Seeded random drift** — gives each player a unique daily movement, same result for the same player+date (consistent across sessions):
```
drift = seededRandom(playerId + dateStr) × 0.10 − 0.05     // ±5%
```

**2. Performance pull** — gently pulls the salary toward where the player naturally sits in the tier based on their `fantasyScore` relative to the tier's score range:
```
normalizedPosition = clamp(
  (fantasyScore − tierBoundaries[tier].minScore)
  / (tierBoundaries[tier].maxScore − tierBoundaries[tier].minScore),
  0, 1
)
pull = (normalizedPosition − 0.5) × 0.03    // ±1.5% pull toward natural position
```

**Combined:**
```
dailyChangePct = drift + pull
newSalary = clamp(salary × (1 + dailyChangePct), tier.floor, tier.ceiling)
```

Net effect: a player at the top of their tier drifts toward the ceiling; one at the bottom drifts toward the floor. But there's enough randomness that it still feels volatile and interesting day-to-day.

---

### Tier Promotion / Demotion

Evaluated each time daily drift runs. Uses the tier score boundaries as the signal:

```
if fantasyScore > tierBoundaries[tier].maxScore:
    overperformDays += 1
    underperformDays = 0
    if overperformDays >= 7:
        → promote one tier step (e.g. S- → S)
        → salary resets to: newTier.floor + 0.2 × (newTier.ceiling − newTier.floor)
           (enters near the bottom of the new tier — must earn the rest)
        → reset both counters

elif fantasyScore < tierBoundaries[tier].minScore:
    underperformDays += 1
    overperformDays = 0
    if underperformDays >= 7:
        → demote one tier step (e.g. S → S-)
        → salary resets to: newTier.ceiling − 0.2 × (newTier.ceiling − newTier.floor)
           (enters near the top of the new tier — still holding some value)
        → reset both counters

else:
    reset both counters to 0   // any "in-tier" day resets the streak
```

**Key rules:**
- Tier changes are one step at a time only — S cannot jump to A+, it goes S → S- → A+
- A player on your team can also be promoted/demoted — your buy price is locked at purchase, but market value changes
- Tier change is a notable event — shown as a badge/alert in the stock market view

---

### Stock Market View

A dedicated panel (likely a tab on the Market page or its own route) showing today's salary movement across all ESPN players:

**Top 5 Gainers** — largest absolute $ increase since yesterday
**Top 5 Losers** — largest absolute $ decrease since yesterday

Each row shows:
```
[Headshot] LeBron James   S   $54.2M  ▲ +$2.8M  (+5.4%)
```

Tier-change events shown with a special badge:
```
[Headshot] Damian Lillard  A+ → A   $28.1M  ▼ −$8.9M  (tier drop)
```

---

### Update Timing

**When does it run?**

On every app load, after `usePlayers` finishes fetching ESPN data:

```
1. usePlayers() resolves → players[] is ready (fantasyScore attached)
2. assignTiers(players) runs → tiers assigned, tierBoundaries snapshot saved
3. useSalaryChanges(players) activates:
     today = 'YYYY-MM-DD'
     if today !== salaryState[anyPlayer].lastUpdatedDate:
         run daily drift + tier check for all players
         write new salaryState to localStorage
     else:
         skip — already ran today, return cached state
```

**Key guard:** `lastUpdatedDate` is a date string (`'2026-02-21'`), not a timestamp. The ESPN cache may refresh every 4 hours, but the salary update only fires once per calendar day regardless of how many times the app loads or the ESPN cache refreshes.

**Dependency order matters:** `useSalaryChanges` must receive a non-empty `players` array. It should short-circuit and return empty state while players are still loading. Never run on stale/empty data.

**What about stale ESPN data?** If the user opens the app at midnight before ESPN has updated, the salary check runs on yesterday's stats. That's acceptable — we're measuring 7-day trends, not reacting to individual games. One day of lag is noise.

---

### Migration Note

**Frontend-only (current):** All logic lives in `useSalaryChanges(players)`. This hook:
- Reads/writes `fbball_salary_state_v1` and `fbball_tier_boundaries` from localStorage
- Generates the daily update internally (seeded random + performance pull)
- Returns a stable data shape

**After backend:** Replace the hook internals with a single fetch. Everything else stays identical.

```js
// Today (frontend):
function useSalaryChanges(players) {
  // reads localStorage, runs generator, writes back
  return { winners, losers, salaryMap, updatedAt }
}

// After backend:
function useSalaryChanges(players) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/salary-changes')
      .then(r => r.json())
      .then(setData)
  }, [])
  return data ?? { winners: [], losers: [], salaryMap: {}, updatedAt: null }
}
```

The hook signature, return shape, and all UI components are unchanged. The backend takes ownership of:
- Running the daily update via cron job (no longer depends on a user loading the app)
- Storing salary state in a database (survives across users and devices)
- Computing `tierBoundaries` server-side after refreshing ESPN data

**localStorage keys used (frontend only — safe to drop after migration):**
- `fbball_salary_state_v1` — per-player salary + drift counters
- `fbball_tier_boundaries` — snapshot of fantasyScore ranges per tier

