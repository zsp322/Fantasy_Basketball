import { useState, useCallback } from 'react'

const STORAGE_KEY   = 'fbball_market'
const REFRESH_MS    = 4 * 60 * 60 * 1000  // 4 hours
const MARKET_SIZE   = 5

function loadMarket() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveMarket(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function pickRandom(allPlayers, excludeIds, count) {
  const pool = allPlayers.filter(p => !excludeIds.includes(p.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function useMarket(allPlayers, teamIds) {
  const [market, setMarket] = useState(() => {
    const saved = loadMarket()
    if (saved && Date.now() - saved.refreshedAt < REFRESH_MS) return saved
    return null  // will be generated once allPlayers loads
  })

  const refreshMarket = useCallback((forceExcludeIds = teamIds) => {
    if (!allPlayers.length) return
    const players = pickRandom(allPlayers, forceExcludeIds, MARKET_SIZE)
    const next = { players, refreshedAt: Date.now() }
    saveMarket(next)
    setMarket(next)
  }, [allPlayers, teamIds])

  // Auto-generate market when players load for the first time
  const shouldGenerate = allPlayers.length > 0 && (
    !market ||
    market.players.length === 0 ||
    Date.now() - market.refreshedAt >= REFRESH_MS
  )
  if (shouldGenerate) {
    const players = pickRandom(allPlayers, teamIds, MARKET_SIZE)
    const next = { players, refreshedAt: Date.now() }
    saveMarket(next)
    // Use a ref-like pattern to avoid setState during render
    if (!market || Date.now() - (market?.refreshedAt ?? 0) >= REFRESH_MS) {
      setTimeout(() => setMarket(next), 0)
    }
  }

  function removeFromMarket(playerId) {
    if (!market) return
    const next = {
      ...market,
      players: market.players.filter(p => p.id !== playerId),
    }
    saveMarket(next)
    setMarket(next)
  }

  const nextRefreshMs = market
    ? Math.max(0, REFRESH_MS - (Date.now() - market.refreshedAt))
    : 0

  return {
    marketPlayers: market?.players ?? [],
    refreshMarket,
    removeFromMarket,
    nextRefreshMs,
    refreshedAt: market?.refreshedAt ?? null,
  }
}
