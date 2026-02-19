import { useState, useEffect } from 'react'
import { fetchActivePlayers } from '../api/players'
import { calcFantasyScore } from '../utils/scoring'
import { assignTiers } from '../utils/tiers'

const CACHE_KEY = 'fbball_players_cache'
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

        const raw = await fetchActivePlayers()

        const withScores = raw.map(player => ({
          ...player,
          fantasyScore: calcFantasyScore(player.avg),
        }))

        const tiered = assignTiers(withScores)

        // Cache result
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
