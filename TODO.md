# Fantasy Basketball — TODO

> Add items here as you find them. Tell Claude to "pick up the TODO list" when ready to work on them.

---

## Bugs 🐛
_(all fixed — see Done ✅)_

---

## Tech Debt 🔧
> Refactoring and code quality — no new behavior, just cleaner internals.

1. Refactor tier colors into a single source of truth — currently changing B tier color requires edits in 6+ files (tiers.js, PlayerSlotCard.jsx, MyTeam.jsx, Simulate.jsx, Market.jsx, npcTeam.js). Should be one constant/map.

---

## Small Features 💡
> Visible improvements that can be done in one session.

1. Add drag-and-drop swap in My Team — currently requires: click slot → pick from bench → then re-add displaced player manually.

---

## Features 🚀
> Larger new functionality, likely multi-session.

1. Add more NPC teams (start with 5 total) — beating each team gives a reward (e.g. 75% of Jokic's salary). Include classic rosters like 1998 MJ Bulls (salary cap ~30M).

2. The overall CSS is not good cross screen. For example in my 4k screen. There are a lot of space, but in 2k screen. Some content are seem too big.

---

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
- [x] Feature: Sell player from My Team — Sell button in SwapDrawer with confirmation overlay; 80% salary refund via dropPlayer

---

## Ultimate Goal 🌟
> Long-term vision — months of work.

1. On-chain game (crypto) — low-salary players like a 15M Jokic or rookie Cooper Flagg can be sold for small profit, making slow-grind play valuable.
2. JS animation engine for actual in-game visuals.
