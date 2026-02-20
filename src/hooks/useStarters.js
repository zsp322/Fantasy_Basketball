import { useState, useEffect } from 'react'
import { resolvePosition, resolveEligiblePositions } from '../utils/scoring'

export const POS_ORDER = ['PG', 'SG', 'SF', 'PF', 'C']
const STORAGE_KEY = 'fbball_starters_v1'

const POS_IDX = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 }

function posDist(naturalPos, slotPos) {
  return Math.abs((POS_IDX[naturalPos] ?? 2) - (POS_IDX[slotPos] ?? 2))
}

function autoAssign(roster) {
  const map = {}
  const used = new Set()

  // Normalize positions for players loaded from localStorage (may have raw ESPN strings like 'G/F', 'PF/C')
  const players = roster.map(p => ({
    ...p,
    position:  resolvePosition(p.position, p.height),
    positions: p.positions ?? resolveEligiblePositions(p.position),
  }))

  // Pass 1: slot is any of the player's eligible positions
  for (const pos of POS_ORDER) {
    const match = players.find(p => !used.has(p.id) && p.positions.includes(pos))
    if (match) { map[pos] = match; used.add(match.id) }
  }

  // Pass 2: fill remaining slots — minimise distance across all eligible positions
  for (const pos of POS_ORDER) {
    if (map[pos]) continue
    const available = players.filter(p => !used.has(p.id))
    if (!available.length) break
    const best = [...available].sort((a, b) => {
      const da = Math.min(...a.positions.map(ep => posDist(ep, pos)))
      const db = Math.min(...b.positions.map(ep => posDist(ep, pos)))
      if (da !== db) return da - db
      return (b.offenseRating ?? 0) - (a.offenseRating ?? 0)
    })[0]
    map[pos] = best
    used.add(best.id)
  }

  // Fill any remaining slots that had no players at all with null
  for (const pos of POS_ORDER) {
    if (!(pos in map)) map[pos] = null
  }

  return map
}

function loadFromStorage(roster) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const ids = JSON.parse(stored) // { PG: id, SG: id, ... }
      const map = {}
      for (const pos of POS_ORDER) {
        const id = ids[pos]
        map[pos] = id ? (roster.find(p => String(p.id) === String(id)) ?? null) : null
      }
      if (Object.values(map).some(Boolean)) return map
    }
  } catch {}
  return autoAssign(roster)
}

export function useStarters(roster) {
  const [starters, setStarters] = useState(() => loadFromStorage(roster))

  // Persist whenever starters change
  useEffect(() => {
    const ids = {}
    for (const [pos, player] of Object.entries(starters)) {
      ids[pos] = player?.id ?? null
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [starters])

  // Remove players that were dropped from the roster
  useEffect(() => {
    setStarters(prev => {
      let changed = false
      const next = { ...prev }
      for (const pos of POS_ORDER) {
        if (prev[pos] && !roster.find(p => String(p.id) === String(prev[pos].id))) {
          next[pos] = null
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [roster])

  function assign(pos, player) {
    setStarters(prev => {
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        if (next[k]?.id === player.id) next[k] = null
      }
      next[pos] = player
      return next
    })
  }

  function remove(pos) {
    setStarters(prev => ({ ...prev, [pos]: null }))
  }

  return { starters, assign, remove }
}
