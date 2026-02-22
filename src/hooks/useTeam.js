import { useState, useCallback } from 'react'
import { SALARY_CAP, STARTING_CASH } from '../utils/teamSetup'

const STORAGE_KEY = 'fbball_team'
const SPIN_COST = 5 // $M cash cost per rookie spin

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const DEFAULT_STATE = {
  initialized: false,   // has the user gone through setup?
  team: [],             // array of player objects
  cash: STARTING_CASH,  // $M remaining to spend
  pendingRookie: null,  // rookie drawn but not yet signed/passed — persists across tab switches
}

export function useTeam() {
  const [state, setState] = useState(() => loadState() ?? DEFAULT_STATE)

  const persist = useCallback((next) => {
    setState(next)
    saveState(next)
  }, [])

  const totalSalary = state.team.reduce((sum, p) => sum + (p.signedSalary ?? p.tier?.salary ?? 0), 0)
  const capRemaining = SALARY_CAP - totalSalary
  const rosterFull = state.team.length >= 15

  function initTeam(foundational, autoPlayers) {
    persist({
      initialized: true,
      team: [foundational, ...autoPlayers],
      cash: STARTING_CASH,
      pendingRookie: null,
    })
  }

  function buyPlayer(player, liveSalary) {
    const cost = parseFloat((liveSalary ?? player.tier?.salary ?? 0).toFixed(1))
    if (state.cash < cost) return { ok: false, reason: 'Not enough cash' }
    if (capRemaining < cost) return { ok: false, reason: 'Salary cap exceeded' }
    if (rosterFull) return { ok: false, reason: 'Roster is full (max 15)' }
    if (state.team.find(p => p.id === player.id)) return { ok: false, reason: 'Already on your team' }

    const playerWithLockedSalary = { ...player, signedSalary: cost }
    persist({
      ...state,
      team: [...state.team, playerWithLockedSalary],
      cash: parseFloat((state.cash - cost).toFixed(1)),
    })
    return { ok: true }
  }

  function dropPlayer(playerId, liveSalary) {
    const player = state.team.find(p => p.id === playerId)
    if (!player) return
    if (player.rookieLocked) return // Rookie contracts cannot be sold this season
    const baseSalary = liveSalary ?? player.signedSalary ?? player.tier?.salary ?? 0
    const refund = parseFloat((baseSalary * 0.9).toFixed(1))
    persist({
      ...state,
      team: state.team.filter(p => p.id !== playerId),
      cash: parseFloat((state.cash + refund).toFixed(1)),
    })
  }

  // Step 1 — pay the spin fee and lock in the drawn rookie.
  // rookie: the player object already picked before the animation.
  // free: true skips cash deduction (dev only).
  function payForSpin(rookie, free = false) {
    if (rosterFull) return { ok: false, reason: 'roster_full' }
    if (!free && state.cash < SPIN_COST) return { ok: false, reason: 'cash' }
    const newCash = free
      ? state.cash
      : parseFloat((state.cash - SPIN_COST).toFixed(1))
    persist({ ...state, cash: newCash, pendingRookie: rookie })
    return { ok: true }
  }

  // Step 2 — sign the pending rookie (deducts salary from cap, not cash).
  // Duplicates allowed — unique id generated per signing.
  function signRookie() {
    const rookie = state.pendingRookie
    if (!rookie) return { ok: false, reason: 'no_pending' }
    if (rosterFull) return { ok: false, reason: 'roster_full' }
    const rookieSalary = rookie.tier?.salary ?? 0
    if (capRemaining < rookieSalary) return { ok: false, reason: 'cap' }
    const player = {
      ...rookie,
      id: `${rookie.id}_${Date.now()}`,
      signedSalary: rookieSalary,
      rookieLocked: true,
    }
    persist({ ...state, team: [...state.team, player], pendingRookie: null })
    return { ok: true }
  }

  // Pass — discard the pending rookie without signing.
  function clearPendingRookie() {
    persist({ ...state, pendingRookie: null })
  }

  function addCash(amount) {
    setState(prev => {
      const next = { ...prev, cash: parseFloat((prev.cash + amount).toFixed(1)) }
      saveState(next)
      return next
    })
  }

  function resetTeam() {
    persist(DEFAULT_STATE)
  }

  return {
    initialized: state.initialized,
    team: state.team,
    cash: state.cash,
    totalSalary: parseFloat(totalSalary.toFixed(1)),
    capRemaining: parseFloat(capRemaining.toFixed(1)),
    rosterFull,
    pendingRookie: state.pendingRookie ?? null,
    initTeam,
    buyPlayer,
    dropPlayer,
    payForSpin,
    signRookie,
    clearPendingRookie,
    addCash,
    resetTeam,
  }
}
