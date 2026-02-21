// ─────────────────────────────────────────────────────────────────────────────
// useSalaryChanges — daily salary drift + tier promotion/demotion
//
// Design: migration-ready. When backend arrives, replace this hook's internals
// with a single fetch('/api/salary-changes'). The return shape is unchanged.
// See GAME_DESIGN.md § 14 for the full algorithm spec.
//
// localStorage keys (frontend-only, safe to drop after migration):
//   fbball_salary_state_v1  — per-player salary + overperform/underperform counters
//   fbball_tier_boundaries  — fantasyScore range per tier (written by usePlayers)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { TIERS, getTierByName } from '../utils/tiers'

const SALARY_STATE_KEY = 'fbball_salary_state_v1'
const TIER_BOUNDARIES_KEY = 'fbball_tier_boundaries'

// Returns today's date as 'YYYY-MM-DD' — the daily update guard key
function getToday() {
  return new Date().toISOString().split('T')[0]
}

// Deterministic pseudo-random float [0, 1) for a given string seed.
// Same player + same date always produces the same value (consistent across sessions).
function seededRandom(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return (h >>> 0) / 0xFFFFFFFF
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function getTierIndex(name) {
  return TIERS.findIndex(t => t.name === name)
}

// ── Core daily update (pure function — no React, no DOM) ──────────────────────
// On backend migration: delete this function, replace useSalaryChanges internals
// with a fetch call. The returned { newState, changes } shape informs the hook's
// return value, which never changes.
function runDailyUpdate(players, salaryState, boundaries, today) {
  const newState = { ...salaryState }
  const changes = []

  for (const player of players) {
    if (!player.tier?.name || !player.id) continue
    const pid = String(player.id)

    // Initialize state for new players
    if (!newState[pid]) {
      newState[pid] = {
        salary: player.tier.salary,     // start at tier midpoint
        tierName: player.tier.name,
        overperformDays: 0,
        underperformDays: 0,
        lastUpdatedDate: null,
      }
    }

    const entry = { ...newState[pid] }
    if (entry.lastUpdatedDate === today) continue   // already ran today

    const prevSalary = entry.salary
    const tier = getTierByName(entry.tierName) ?? player.tier
    const tierIdx = getTierIndex(tier.name)
    const bounds = boundaries[tier.name]
    let tierChanged = null

    // ── Tier promotion / demotion ─────────────────────────────────────────
    if (bounds && player.fantasyScore != null) {
      if (player.fantasyScore > bounds.maxScore) {
        entry.overperformDays = (entry.overperformDays || 0) + 1
        entry.underperformDays = 0
        if (entry.overperformDays >= 7 && tierIdx > 0) {
          const newTier = TIERS[tierIdx - 1]
          tierChanged = { from: tier.name, to: newTier.name, direction: 'up' }
          entry.tierName = newTier.name
          // Enter near the bottom of the new tier — must earn the rest
          entry.salary = newTier.floor + 0.2 * (newTier.ceiling - newTier.floor)
          entry.overperformDays = 0
          entry.underperformDays = 0
        }
      } else if (player.fantasyScore < bounds.minScore) {
        entry.underperformDays = (entry.underperformDays || 0) + 1
        entry.overperformDays = 0
        if (entry.underperformDays >= 7 && tierIdx < TIERS.length - 1) {
          const newTier = TIERS[tierIdx + 1]
          tierChanged = { from: tier.name, to: newTier.name, direction: 'down' }
          entry.tierName = newTier.name
          // Enter near the top of the new tier — still holding some value
          entry.salary = newTier.ceiling - 0.2 * (newTier.ceiling - newTier.floor)
          entry.overperformDays = 0
          entry.underperformDays = 0
        }
      } else {
        // In-tier: any in-range day resets the streak
        entry.overperformDays = 0
        entry.underperformDays = 0
      }
    }

    // ── Salary drift within tier (only when no tier change happened) ──────
    if (!tierChanged) {
      const currentTier = getTierByName(entry.tierName)
      if (currentTier) {
        const tierBounds = boundaries[currentTier.name]
        let normalizedPosition = 0.5  // fallback: middle of tier

        if (tierBounds) {
          const range = tierBounds.maxScore - tierBounds.minScore
          normalizedPosition = range > 0
            ? clamp((player.fantasyScore - tierBounds.minScore) / range, 0, 1)
            : 0.5
        }

        const drift = seededRandom(pid + today) * 0.10 - 0.05  // ±5% seeded random
        const pull  = (normalizedPosition - 0.5) * 0.03         // ±1.5% gravity toward natural position
        entry.salary = clamp(
          entry.salary * (1 + drift + pull),
          currentTier.floor,
          currentTier.ceiling,
        )
      }
    }

    entry.lastUpdatedDate = today
    newState[pid] = entry

    changes.push({
      player,
      prevSalary,
      newSalary: entry.salary,
      delta: entry.salary - prevSalary,
      pct: prevSalary > 0 ? ((entry.salary - prevSalary) / prevSalary) * 100 : 0,
      tierChanged,   // null | { from, to, direction: 'up'|'down' }
    })
  }

  return { newState, changes }
}

// ── Public hook ───────────────────────────────────────────────────────────────
//
// Accepts the full tiered player pool from usePlayers.
// Returns:
//   winners    — top 5 salary gainers today
//   losers     — top 5 salary losers today
//   salaryMap  — { [playerId]: currentSalary } for every player
//   updatedAt  — 'YYYY-MM-DD' of last update, or null
//
// MIGRATION NOTE: to move to backend, replace everything inside this function
// with a fetch('/api/salary-changes') call that returns the same shape.
export function useSalaryChanges(players) {
  const [result, setResult] = useState({
    winners: [],
    losers: [],
    salaryMap: {},
    updatedAt: null,
  })

  useEffect(() => {
    // Wait for players to be loaded — never run on empty data
    if (!players || players.length === 0) return

    const today = getToday()

    let salaryState = {}
    let boundaries = {}
    try {
      salaryState = JSON.parse(localStorage.getItem(SALARY_STATE_KEY) || '{}')
      boundaries  = JSON.parse(localStorage.getItem(TIER_BOUNDARIES_KEY) || '{}')
    } catch { /* corrupt storage — start fresh */ }

    function buildSalaryMap(state) {
      const map = {}
      players.forEach(p => {
        const e = state[String(p.id)]
        map[String(p.id)] = e?.salary ?? p.tier?.salary ?? 0
      })
      return map
    }

    // Check if any player needs a daily update
    const needsUpdate = players.some(p => {
      const entry = salaryState[String(p.id)]
      return !entry || entry.lastUpdatedDate !== today
    })

    if (!needsUpdate) {
      // Already ran today — serve cached state, no winners/losers to show
      setResult(prev => {
        if (prev.updatedAt === today) return prev   // no-op
        return { winners: [], losers: [], salaryMap: buildSalaryMap(salaryState), updatedAt: today }
      })
      return
    }

    const { newState, changes } = runDailyUpdate(players, salaryState, boundaries, today)
    localStorage.setItem(SALARY_STATE_KEY, JSON.stringify(newState))

    // Only include players that had an existing salary (skip first-ever init)
    const meaningful = changes.filter(c => c.prevSalary !== c.player.tier?.salary || c.tierChanged)
    const byGain   = [...meaningful].sort((a, b) => b.delta - a.delta)
    const byLoss   = [...meaningful].sort((a, b) => a.delta - b.delta)

    setResult({
      winners:   byGain.slice(0, 5),
      losers:    byLoss.filter(c => c.delta < 0).slice(0, 5),
      salaryMap: buildSalaryMap(newState),
      updatedAt: today,
    })
  }, [players])

  return result
}
