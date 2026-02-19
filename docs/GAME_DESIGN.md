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
