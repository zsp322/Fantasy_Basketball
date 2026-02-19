import { useState, useCallback } from 'react'
import { hasChineseName } from '../data/playerNames'

const STORAGE_KEY   = 'fbball_market'
const REFRESH_MS    = 4 * 60 * 60 * 1000  // 4 hours
const MARKET_SIZE   = 5

// Position groups for balanced market generation
const GUARD_POS   = new Set(['PG', 'SG', 'G'])
const FORWARD_POS = new Set(['SF', 'PF', 'F'])
const CENTER_POS  = new Set(['C'])

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

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pickRandom(allPlayers, excludeIds, count) {
  const pool = allPlayers.filter(p => !excludeIds.includes(p.id))

  // Prefer players with Chinese name translations (more widely known)
  const zhPool = pool.filter(p => hasChineseName(p))
  const workPool = zhPool.length >= count ? zhPool : pool

  // Pick position-balanced: 2 guards, 2 forwards, 1 center
  const guards   = shuffle(workPool.filter(p => GUARD_POS.has(p.position)))
  const forwards = shuffle(workPool.filter(p => FORWARD_POS.has(p.position)))
  const centers  = shuffle(workPool.filter(p => CENTER_POS.has(p.position)))

  const picked = []
  const usedIds = new Set()

  function take(arr, n) {
    arr.filter(p => !usedIds.has(p.id)).slice(0, n).forEach(p => {
      picked.push(p)
      usedIds.add(p.id)
    })
  }

  take(guards, 2)
  take(forwards, 2)
  take(centers, 1)

  // Fill any remaining slots (e.g. not enough centers) from the full pool
  if (picked.length < count) {
    take(shuffle(workPool), count - picked.length)
  }

  return shuffle(picked).slice(0, count)
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
