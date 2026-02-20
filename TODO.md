# Fantasy Basketball — TODO / Bug List

> Add items here as you find them. Tell Claude to "pick up the TODO list" when ready to work on them.

---

## Bugs 🐛
1. The score board per quarter in the simulate isn't correct
2. Change B category player to a different color, right now it's not too much difference from A tier player

## TODO / Improvements 💡
1. The salary distribution needs to be re-do, the best player needs to be at 700K(Like in real world).
2. Team init animation: reveal the 7 auto-assigned players one by one with an animation (currently just tells the user "+7 players" but doesn't show who they are).


## Features
1. Add more NPC teams (start with 5) — beating each team gives a reward (e.g. 75% of Jokic's current salary). Include classic players like Michael Jordan 1998 version (salary cap ~30M).


## Done ✅
- [x] Bug: Language settings incorrect on team init screen
- [x] Tell users what the initialization team roster includes (+7 auto-assigned players note)
- [x] Initialize market with more well-known players (v1.0.1)
- [x] Foundation player pick: exclude S+ players, show 5 random S/S- for user to pick one
- [x] User can sell team players for cash (salary × 0.8, 20% penalty)
- [x] Dev hard reset button (clears all localStorage, only visible in dev)
- [x] Bug: Team init assigns players to wrong positions (e.g. AD to PG) — fixed via resolvePosition + resolveEligiblePositions using ESPN height data
- [x] Bug: Player card border color incorrect — root cause was same non-standard position strings; fixed alongside position normalization
- [x] Bug: Hover tooltip on NPC team missing player name — added name header to StatTooltip
- [x] Default simulate speed to Slow
- [x] Player position precision: map ESPN abbreviations (G, F, G/F, PF/C, etc.) to exact slots using height; multi-position players (SF/PF, G/F, etc.) can fill any of their eligible slots without penalty


## Ultimate Goal
1. On-chain game (crypto) — low-salary players like a 15M Jokic or rookie Cooper Flagg can be sold for small profit, making slow-grind play valuable.
2. JS animation engine for actual in-game visuals.
