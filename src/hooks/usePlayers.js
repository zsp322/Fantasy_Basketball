import { useState, useEffect } from 'react'
import { fetchActivePlayers } from '../api/players'
import { calcFantasyScore, calcOffenseRating, calcDefenseRating, calcUsagePossessions, resolvePosition, resolveEligiblePositions } from '../utils/scoring'
import { assignTiers, computeTierBoundaries } from '../utils/tiers'
import { ROOKIE_IDS } from '../data/rookiePlayers'

const CACHE_KEY = 'fbball_players_cache_v8' // bumped: dynamic season ID (was hardcoded 2025)
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        // Check session cache first
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_TTL) {
            setPlayers(data)
            setLoading(false)
            return
          }
        }

        const rawAll = await fetchActivePlayers()
        // Exclude 2025 rookie class — they are only obtainable via the slot machine
        const raw = rawAll.filter(p => !ROOKIE_IDS.has(String(p.id)))

        const withScores = raw.map(player => ({
          ...player,
          position:       resolvePosition(player.position, player.height),   // primary slot (single string)
          positions:      resolveEligiblePositions(player.position),          // all eligible slots (array)
          fantasyScore:      calcFantasyScore(player.avg),      // internal — tier assignment only
          offenseRating:    calcOffenseRating(player.avg),    // shown in UI
          defenseRating:    calcDefenseRating(player.avg),    // shown in UI
          usagePossessions: calcUsagePossessions(player.avg), // game engine attacker weighting
        }))

        const tiered = assignTiers(withScores)

        // Save tier score boundaries for salary drift calculations (useSalaryChanges)
        const boundaries = computeTierBoundaries(tiered)
        localStorage.setItem('fbball_tier_boundaries', JSON.stringify(boundaries))

        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: tiered,
          timestamp: Date.now(),
        }))

        setPlayers(tiered)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { players, loading, error }
}
