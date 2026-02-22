# Fantasy Basketball — TODO

> Add items here as you find them. Tell Claude to "pick up the TODO list" when ready to work on them.

---

## Bugs 🐛
_(all fixed — see Done ✅)_
---

## UI Improvments 🐛
_(all fixed — see Done ✅)_
---

---

## Small Features 💡
> Visible improvements that can be done in one session.

_(all done — see Done ✅)_
---

## Features 🚀
> Larger new functionality, likely multi-session.

1. Add more NPC teams (start with 5 total) — beating each team gives a reward (e.g. 75% of Jokic's salary). Include classic player like 1998 MJ Bulls (salary cap ~30M.).

2. The overall CSS is not good cross screen. For example in my 4k screen. There are a lot of space, but in 2k screen. Some content are seem too big. It fits to mobile for some pages, but my Team screen, the player card is too big

3. Have a tab showing all players, user can search by name, which can see its market salary, stats, etc.

4. Add a coach settings in the team.

5. **Pre-Game Scheme System** — user picks offensive + defensive scheme before simulation starts. Full design in `docs/GAME_DESIGN.md §15`.
   - **Files to create**: `src/data/gameSchemes.js` (pure data: scheme constants)
   - **Files to modify**: `src/utils/gameEngine.js` (add `gameConfig` param to `simulateGame` + `resumeSimulation`), `src/pages/Simulate.jsx` (scheme picker UI pre-game), `src/data/i18n.js` (scheme name/desc strings)
   - **Scheme order**: implement 6 first (Isolation, Ball Movement, 3-Heavy, Man-to-Man, Zone, Pressure). Run & Gun last (changes possessions/clock math).
   - **NPC schemes**: hardcoded per opponent; Warriors = Ball Movement + Man-to-Man

## After Backend
1. Simulate against each other. It can either be a live game, or simulate between your team and player's roster as a NPC team

2. **Value Badge (★) — multiplayer feature**: In a multiplayer league, each player (e.g. LeBron) can be owned by multiple users at different locked salaries. The copy with the lowest `signedSalary` across all owners gets a ★ badge on their card, indicating best value. That player also receives a **+5% buff to both offenseRating and defenseRating** in simulation. Requires backend to expose the full league roster with per-owner locked salaries.
---

## Tech Debt 🔧
> Refactoring and code quality — no new behavior, just cleaner internals.

1. Make sure the local storage are in a state can be move to backend later, also is migration ready state, keep that in your memory


## Future Work (needs ESPN game log API) 🔮

1. **Per-game salary reaction** — Currently salary drift uses season averages (`player.avg`), so a 40-pt game only nudges the average slightly. To make salaries react to last night's performance, use the ESPN game log API:
   `GET /apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog`
   Compare last game's line vs. season average → large outperformance (e.g. >1.5× avg pts) → bigger salary spike.
   The tier-promotion streak already uses `gp` to count games; the game log would feed into the same `outperformGames` counter with actual game-level data instead of slow avg drift.

## Innovation


## Done ✅

---

## Ultimate Goal 🌟
> Long-term vision — months of work.

1. On-chain game (crypto) — low-salary players like a 15M Jokic or rookie Cooper Flagg can be sold for small profit, making slow-grind play valuable.

2. JS animation engine for actual in-game visuals.

3. Publish to more users?
