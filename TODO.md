# Fantasy Basketball — TODO

> Add items here as you find them. Tell Claude to "pick up the TODO list" when ready to work on them.

---

## Bugs 🐛
1. No way to sell / release players from the roster — needs a proper UX design (sell for 80% salary refund, with confirmation).
2. 2 reset buttons in the myTeam page

---

## Tech Debt 🔧
> Refactoring and code quality — no new behavior, just cleaner internals.

1. Refactor tier colors into a single source of truth — currently changing B tier color requires edits in 6+ files (tiers.js, PlayerSlotCard.jsx, MyTeam.jsx, Simulate.jsx, Market.jsx, npcTeam.js). Should be one constant/map.
2. Consolidate all hardcoded bilingual strings into i18n.js — many components (PlayerStatsPopup, SwapDrawer, BenchSwapPanel in Simulate, etc.) embed zh/en strings inline (e.g. `lang === 'zh' ? '进攻' : 'ATK'`) instead of using the T + t() system.

---

## Small Features 💡
> Visible improvements that can be done in one session.

1. The salary distribution needs to be re-done — the best player should be ~700K (like real NBA scale), and remember this will later move to backend. Frontend only shows the player stats.
2. Add drag-and-drop swap in My Team — currently requires: click slot → pick from bench → then re-add displaced player manually.
3. Hover popup (PlayerStatsPopup) on FoundationalPick and TeamReveal init stages — currently no stats on hover during setup.

---

## Features 🚀
> Larger new functionality, likely multi-session.

1. Add more NPC teams (start with 5 total) — beating each team gives a reward (e.g. 75% of Jokic's salary). Include classic rosters like 1998 MJ Bulls (salary cap ~30M).

2. The overall CSS is not good cross screen. For example in my 4k screen. There are a lot of space, but in 2k screen. Some content are seem too big

---

## Done ✅
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

---

## Ultimate Goal 🌟
> Long-term vision — months of work.

1. On-chain game (crypto) — low-salary players like a 15M Jokic or rookie Cooper Flagg can be sold for small profit, making slow-grind play valuable.
2. JS animation engine for actual in-game visuals.
