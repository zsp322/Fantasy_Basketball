import { useState, useCallback } from 'react'
import { SALARY_CAP, STARTING_CASH } from '../utils/teamSetup'

const STORAGE_KEY = 'fbball_team'

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
}

export function useTeam() {
  const [state, setState] = useState(() => loadState() ?? DEFAULT_STATE)

  const persist = useCallback((next) => {
    setState(next)
    saveState(next)
  }, [])

  const totalSalary = state.team.reduce((sum, p) => sum + (p.tier?.salary ?? 0), 0)
  const capRemaining = SALARY_CAP - totalSalary
  const rosterFull = state.team.length >= 15

  function initTeam(foundational, autoPlayers) {
    persist({
      initialized: true,
      team: [foundational, ...autoPlayers],
      cash: STARTING_CASH,
    })
  }

  function buyPlayer(player) {
    const cost = player.tier?.salary ?? 0
    if (state.cash < cost) return { ok: false, reason: 'Not enough cash' }
    if (capRemaining < cost) return { ok: false, reason: 'Salary cap exceeded' }
    if (rosterFull) return { ok: false, reason: 'Roster is full (max 15)' }
    if (state.team.find(p => p.id === player.id)) return { ok: false, reason: 'Already on your team' }

    persist({
      ...state,
      team: [...state.team, player],
      cash: parseFloat((state.cash - cost).toFixed(1)),
    })
    return { ok: true }
  }

  function dropPlayer(playerId) {
    const player = state.team.find(p => p.id === playerId)
    if (!player) return
    // 20% sell penalty — player receives 80% of salary back
    const refund = parseFloat(((player.tier?.salary ?? 0) * 0.8).toFixed(1))
    persist({
      ...state,
      team: state.team.filter(p => p.id !== playerId),
      cash: parseFloat((state.cash + refund).toFixed(1)),
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
    initTeam,
    buyPlayer,
    dropPlayer,
    resetTeam,
  }
}
