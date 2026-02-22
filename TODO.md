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

4. Add a coach settings in the team.

5. **Pre-Game Scheme System** — user picks offensive + defensive scheme before simulation starts. Full design in `docs/GAME_DESIGN.md §15`.
   - **Files to create**: `src/data/gameSchemes.js` (pure data: scheme constants)
   - **Files to modify**: `src/utils/gameEngine.js` (add `gameConfig` param to `simulateGame` + `resumeSimulation`), `src/pages/Simulate.jsx` (scheme picker UI pre-game), `src/data/i18n.js` (scheme name/desc strings)
   - **Scheme order**: implement 6 first (Isolation, Ball Movement, 3-Heavy, Man-to-Man, Zone, Pressure). Run & Gun last (changes possessions/clock math).
   - **NPC schemes**: hardcoded per opponent; Warriors = Ball Movement + Man-to-Man

## After Backend
1. Simulate against each other. It can either be a live game, or simulate between your team and player's roster as a NPC team
---

## Tech Debt 🔧
> Refactoring and code quality — no new behavior, just cleaner internals.

1. Refactor tier colors into a single source of truth — currently changing B tier color requires edits in 6+ files (tiers.js, PlayerSlotCard.jsx, MyTeam.jsx, Simulate.jsx, Market.jsx, npcTeam.js). Should be one constant/map.

12. Make sure the local storage are in a state can be move to backend later, also is migration ready state, keep that in your memory


## Innovation


## Done ✅
- [x] Bug: Box score at game end showed empty stats — now computed from ALL plays via computeFinalBoxScore(); subbed-out players show correct stats
- [x] Bug: Box score missing MIN column — added, approximated as appearances × 1.5 capped at 48
- [x] Bug: Auto-simulate swapped players out but never back — now continuous; removed permanent blocklist, bench players recover 1.5% energy/play; best available bench player chosen by ATK+DEF × pos-match × energy
- [x] Bug: 我的队 still in navbar — hardcoded zh string in Navbar.jsx fixed to 我的球队
- [x] Bug: Reset button showing in production — now DEV only (hard reset); soft reset removed entirely
- [x] Bug: Player names in simulate play-by-play didn't respect language — now uses Chinese names in zh descriptions via getPlayerShortName
- [x] Bug: MyTeam SwapDrawer position modal hardcoded English — all strings now use i18n (position label, current player, remove btn, bench labels)
- [x] Tech Debt: Consolidated all BenchSwapPanel + pause/resume inline zh/en strings into i18n.js
- [x] Feature: Hover popup (PlayerStatsPopup) on FoundationalPick + TeamReveal init screens
- [x] Bug: Quarter scoreboard showed all 4 quarters pre-computed from game start — now shows only completed quarters + live current quarter
- [x] Bug: B tier color (cyan) too similar to A tier (blue) — changed to teal
- [x] Bug: MyTeam hover popup ignored language setting — name and all stat labels now respect lang
- [x] Bug: SwapDrawer bench list not sorted by ability — now sorted by effective ATK+DEF with mismatch penalty applied; mismatch badge shown
- [x] Bug: Language settings incorrect on team init screen
- [x] Tell users what the initialization team roster includes (+7 auto-assigned players note)
- [x] Initialize market with more well-known players (v1.0.1)
- [x] Foundation player pick: exclude S+ players, show 5 random S/S- for user to pick one
- [x] Dev hard reset button (clears all localStorage, only visible in dev)
- [x] Bug: Team init assigns players to wrong positions (e.g. AD to PG) — fixed via resolvePosition + resolveEligiblePositions using ESPN height data
- [x] Bug: Player card border color incorrect — root cause was non-standard ESPN position strings; fixed alongside position normalization
- [x] Bug: Hover tooltip on NPC team missing player name — added name header to StatTooltip
- [x] Default simulate speed to Slow
- [x] In My Team page, lineup cards 25% bigger and bench strip 20% taller
- [x] Team init animation — cards reveal one by one with tier-glow borders + Shuffle button to regenerate auto picks
- [x] Player position precision: map ESPN abbreviations (G, F, G/F, PF/C, etc.) to exact slots using height; multi-position players can fill any eligible slot without penalty
- [x] Salary rescaled to real NBA scale — S+ = $70M, proportional down to F = $0.8M; cache bumped to v5
- [x] Win reward — beating the NPC team grants $5M cash, shown as a green banner on the simulate page
- [x] Bug: Win reward cash not applied — addCash used stale closure state; fixed with functional setState form
- [x] Feature: Sell player from My Team — sell penalty changed to 90% refund via dropPlayer
- [x] Bug: Version guard clears storage on every version bump — now only clears for users below v1.0.9; future upgrades preserve data
- [x] Bug: Fouls missing from simulate box score and live stats — now tracked when defender commits a shooting foul (FT trips)
- [x] Bug: Simulation swaps persisted to My Team lineup — sim now uses local-only starters state (simStartersMap), My Team lineup unchanged after game
- [x] Small: Renamed NPC team short name to "2015-16 Warriors"
- [x] Small: Removed Tournaments/League from Navbar
- [x] Small: SwapDrawer current player now shows tier badge inline + ATK/DEF instead of raw PTS/REB/AST
- [x] Small: Player names now use full first+last name in English (cards, tooltips, play-by-play)
- [x] UI: Quarter/time labels in play log barely visible in dark mode — bumped to text-gray-400
- [x] UI: NPC team logo smaller than My Team badge — both now 40×40; NPC image 38×38
- [x] UI: Position text hard to read in dark mode — text-gray-600/500 → text-gray-400 across MyTeam, SwapDrawer, Market, Simulate box score & BenchSwapPanel, PlayerSlotCard empty slot
- [x] Small: Sell penalty changed from 80% → 90% refund
- [x] Small: Assist algorithm now weights by player avg assists + 1.5× PG bonus (both simulateGame + resumeSimulation)
- [x] Small: Shot attacker selection now weights by Usage Possessions (FGA + 0.44×FTA + TO) × efficiency × energy — high-usage players get the ball more realistically; cache bumped to v6
- [x] Small: Drag-and-drop swap in My Team — drag bench chip → starter slot (assign), starter → starter slot (swap), starter → bench strip (remove from lineup); purple glow on drop targets
- [x] Feature: Slot Machine (抽卡) — 6 hardcoded 2025 NBA rookies (Flagg, Harper, Bailey, Edgecombe, Johnson, Maluach); $5M per spin; 3D card flip reveal; rookie contracts locked (no sell); excluded from market + init pool; /spin route + nav link

---

## Ultimate Goal 🌟
> Long-term vision — months of work.

1. On-chain game (crypto) — low-salary players like a 15M Jokic or rookie Cooper Flagg can be sold for small profit, making slow-grind play valuable.

2. JS animation engine for actual in-game visuals.

3. Publish to more users?
