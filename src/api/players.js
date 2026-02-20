const ESPN_STATS_URL = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete'
const ESPN_ROSTER_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams'

const NBA_TEAM_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
]

// Fetch all team rosters to get player info + headshots + injury status
async function fetchAllRosters() {
  const results = await Promise.all(
    NBA_TEAM_IDS.map(id =>
      fetch(`${ESPN_ROSTER_URL}/${id}/roster`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  )

  const players = {}
  for (const result of results) {
    if (!result?.athletes) continue
    for (const p of result.athletes) {
      players[p.id] = {
        id: p.id,
        first_name: p.firstName,
        last_name: p.lastName,
        height: p.height ?? null,         // inches — used for position resolution
        position: p.position?.abbreviation ?? '',
        headshot: p.headshot?.href ?? null,
        status: p.injuries?.[0]?.status ?? null,
        jersey: p.jersey ?? null,
      }
    }
  }
  return players
}

// Fetch all season averages from ESPN stats API (paginated)
async function fetchAllStats() {
  const statsMap = {}
  let page = 1
  let totalPages = 1

  do {
    const url = new URL(ESPN_STATS_URL)
    url.searchParams.set('region', 'us')
    url.searchParams.set('lang', 'en')
    url.searchParams.set('contentorigin', 'espn')
    url.searchParams.set('isqualified', 'false')
    url.searchParams.set('limit', '100')
    url.searchParams.set('page', page)
    url.searchParams.set('sort', 'offensive.avgPoints:desc')
    url.searchParams.set('season', '2025')
    url.searchParams.set('seasontype', '2')

    const res = await fetch(url)
    if (!res.ok) break
    const json = await res.json()

    totalPages = json.pagination?.pages ?? 1

    // ESPN offensive category indices:
    // 0=pts 1=fgm 2=fga 3=fg% 4=fg3m 5=fg3a 6=fg3% 7=ftm 8=fta 9=ft% 10=ast 11=to
    const offIdx = { pts: 0, fgm: 1, fga: 2, fg3m: 4, fg3a: 5, ftm: 7, fta: 8, ast: 10, to: 11 }
    const defIdx = { stl: 0, blk: 1 }
    const genIdx = { gp: 0, min: 1, reb: 11 }

    for (const item of json.athletes ?? []) {
      const off = item.categories?.find(c => c.name === 'offensive')?.values ?? []
      const def = item.categories?.find(c => c.name === 'defensive')?.values ?? []
      const gen = item.categories?.find(c => c.name === 'general')?.values ?? []

      statsMap[item.athlete.id] = {
        pts:  off[offIdx.pts]  ?? 0,
        fgm:  off[offIdx.fgm]  ?? 0,
        fga:  off[offIdx.fga]  ?? 0,
        fg3m: off[offIdx.fg3m] ?? 0,
        fg3a: off[offIdx.fg3a] ?? 0,
        ftm:  off[offIdx.ftm]  ?? 0,
        fta:  off[offIdx.fta]  ?? 0,
        ast:  off[offIdx.ast]  ?? 0,
        to:   off[offIdx.to]   ?? 0,
        stl:  def[defIdx.stl]  ?? 0,
        blk:  def[defIdx.blk]  ?? 0,
        gp:   gen[genIdx.gp]   ?? 0,
        min:  gen[genIdx.min]  ?? 0,
        reb:  gen[genIdx.reb]  ?? 0,
        teamAbbr: item.athlete.team?.abbreviation ?? '',
      }
    }

    page++
  } while (page <= totalPages)

  return statsMap
}

export async function fetchActivePlayers() {
  const [rosterMap, statsMap] = await Promise.all([
    fetchAllRosters(),
    fetchAllStats(),
  ])

  const players = []
  for (const [id, info] of Object.entries(rosterMap)) {
    players.push({
      ...info,
      avg: statsMap[id] ?? null,
    })
  }

  return players
}

export function getHeadshotUrl(player) {
  return player.headshot ?? null
}
