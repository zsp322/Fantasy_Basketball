import { pickPlayText } from '../data/playTexts.js'
import { getPlayerShortName } from '../data/playerNames.js'

// ─── Constants ───────────────────────────────────────────────────────────────
const QUARTERS = 4
const POSSESSIONS_PER_QUARTER = 20  // per team → 80/team total
const OT_POSSESSIONS = 10           // per team, ~5 minutes per OT period

// Energy sub threshold: if a player drops below this at quarter end, sub them out
const SUB_THRESHOLD = 38

// ─── Position mismatch ────────────────────────────────────────────────────────
const POS_IDX = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 }

export function getPosMismatchMult(naturalPos, slotPos, eligiblePositions) {
  if (!naturalPos || !slotPos) return 1.0
  const eligible = eligiblePositions ?? [naturalPos]
  if (eligible.includes(slotPos)) return 1.0
  const minDiff = Math.min(...eligible.map(p => Math.abs((POS_IDX[p] ?? 2) - (POS_IDX[slotPos] ?? 2))))
  return [1.0, 0.85, 0.65, 0.45, 0.20][minDiff] ?? 1.0
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rand(min, max) {
  return min + Math.random() * (max - min)
}

function weightedPick(players, weightFn) {
  const weights = players.map(p => Math.max(weightFn(p), 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < players.length; i++) {
    r -= weights[i]
    if (r <= 0) return players[i]
  }
  return players[players.length - 1]
}

// 80% chance: match by position, else weighted by defense
function posMatchPick(players, pos, weightFn) {
  if (Math.random() < 0.80) {
    const same = players.find(p => (p.positions ?? [p.position]).includes(pos))
    if (same) return same
  }
  return weightedPick(players, weightFn)
}

// ─── Energy ──────────────────────────────────────────────────────────────────
function getDrainRate(player) {
  const min = player.avg?.min ?? 20
  return Math.max(0.55, 2.5 - (min / 40) * 2.0)
}

export function getEnergyMultiplier(energy) {
  if (energy >= 70) return 1.00
  if (energy >= 50) return 0.85
  if (energy >= 30) return 0.68
  return 0.50
}

function getEnergyLabel(energy) {
  if (energy >= 70) return null
  if (energy >= 50) return '(tired)'
  if (energy >= 30) return '(very tired)'
  return '(EXHAUSTED)'
}

// ─── Zone / streak helpers ───────────────────────────────────────────────────
// Positive streak = consecutive made FGs; negative = consecutive misses/TOs.
// FT shots do NOT affect streak.
function getZoneMult(streak) {
  if (streak >= 5) return 1.30  // ON FIRE
  if (streak >= 3) return 1.15  // HOT
  if (streak <= -5) return 0.75 // FROZEN
  if (streak <= -3) return 0.85 // COLD
  return 1.0
}

export function getZoneLabel(streak) {
  if (streak >= 5) return 'fire'
  if (streak >= 3) return 'hot'
  if (streak <= -5) return 'frozen'
  if (streak <= -3) return 'cold'
  return null
}

function updateStreak(streakMap, id, result) {
  const cur = streakMap[id] ?? 0
  if (result.shotType === 'FT') return
  if (result.turnover || !result.made) {
    streakMap[id] = cur > 0 ? -1 : cur - 1
  } else {
    streakMap[id] = cur < 0 ? 1 : cur + 1
  }
}

// Returns the zone label if the player JUST crossed a threshold (for notifications)
function getZoneEntered(before, after) {
  if (before <  3 && after >=  3 && after <  5) return 'hot'
  if (before <  5 && after >=  5)               return 'fire'
  if (before > -3 && after <= -3 && after > -5) return 'cold'
  if (before > -5 && after <= -5)               return 'frozen'
  return null
}

// ─── Shot logic ──────────────────────────────────────────────────────────────
function pickShotType(avg) {
  const fga      = Math.max(avg?.fga ?? 1, 1)
  const fg3aRate = Math.min((avg?.fg3a ?? 0) / fga, 0.70)
  const ftRate   = Math.min((avg?.fta ?? 0) / fga * 0.35, 0.22)
  const r = Math.random()
  if (r < fg3aRate) return '3pt'
  if (r < fg3aRate + ftRate) return 'FT'
  return '2pt'
}

function get3ptChance(avg) {
  const fg3a = avg?.fg3a ?? 0
  return fg3a > 0 ? (avg?.fg3m ?? 0) / fg3a : 0.33
}

function get2ptChance(avg) {
  const twoPA = Math.max((avg?.fga ?? 1) - (avg?.fg3a ?? 0), 1)
  const twoPM = Math.max((avg?.fgm ?? 0) - (avg?.fg3m ?? 0), 0)
  return twoPM / twoPA
}

function getFtChance(avg) {
  const fta = Math.max(avg?.fta ?? 1, 1)
  return (avg?.ftm ?? 0) / fta
}

// ─── Play descriptions ────────────────────────────────────────────────────────
function buildDescription(play) {
  const atkEn  = getPlayerShortName(play.attacker, 'en')
  const defEn  = play.defender ? getPlayerShortName(play.defender, 'en') : ''
  const atkZh  = getPlayerShortName(play.attacker, 'zh')
  const defZh  = play.defender ? getPlayerShortName(play.defender, 'zh') : ''
  const tired  = getEnergyLabel(play.atkEnergyAfter)
  const texts  = pickPlayText(play)

  const tiredEn = tired ? ` ${tired}` : ''
  const tiredZh = tired === '(tired)'      ? '（体力下降）'
                : tired === '(very tired)' ? '（十分疲惫）'
                : tired === '(EXHAUSTED)'  ? '（精疲力竭）' : ''

  let en = texts.en.replace('{atk}', `${atkEn}${tiredEn}`).replace('{def}', defEn)
  let zh = texts.zh.replace('{atk}', `${atkZh}${tiredZh}`).replace('{def}', defZh)

  if (play.shotType === 'FT') {
    const ftResultEn = `${play.ftMade}/2 FT`
    const ftResultZh = play.ftMade === 2 ? '两罚全中' : play.ftMade === 1 ? '一中一失' : '两球落空'
    en = `${en} — ${ftResultEn}`
    zh = `${zh} — ${ftResultZh}`
  }

  // Assist text on made field goals
  if (play.assister && play.made && play.shotType !== 'FT') {
    const astEn = getPlayerShortName(play.assister, 'en')
    const astZh = getPlayerShortName(play.assister, 'zh')
    en += Math.random() < 0.5 ? ` ${astEn} with the assist.` : ` Assisted by ${astEn}.`
    zh += `，${astZh}助攻。`
  }

  return { en, zh }
}

// ─── Box score ────────────────────────────────────────────────────────────────
function emptyBox() {
  return { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0, fga: 0, fgm: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0 }
}

function updateBox(box, id, result, role) {
  const e = box[id]
  if (!e) return

  if (role === 'attacker') {
    if (result.turnover) { e.to++; return }
    if (result.shotType === 'FT') {
      e.fta += 2; e.ftm += result.ftMade; e.pts += result.points; return
    }
    e.fga++
    if (result.shotType === '3pt') {
      e.fg3a++
      if (result.made) { e.fg3m++; e.fgm++; e.pts += 3 }
    } else {
      if (result.made) { e.fgm++; e.pts += 2 }
    }
  } else {
    if (result.specialEvent === 'steal') e.stl++
    if (result.specialEvent === 'block') e.blk++
    if (result.shotType === 'FT') e.foul++
    if (!result.made && !result.turnover && result.specialEvent !== 'steal') {
      if (Math.random() < 0.70) e.reb++
    }
  }
  if (role === 'attacker' && result.specialEvent === 'off_reb') e.reb++
}

// ─── Core possession simulator ───────────────────────────────────────────────
function simulatePossession(attacker, defender, atkEnergy, defEnergy, zoneMult = 1.0) {
  const atkMult    = getEnergyMultiplier(atkEnergy)
  const defMult    = getEnergyMultiplier(defEnergy)
  const atkPosMult = getPosMismatchMult(attacker.position, attacker.playingAs, attacker.positions)
  const defPosMult = getPosMismatchMult(defender.position, defender.playingAs, defender.positions)
  const avg = attacker.avg ?? {}

  const toBoost  = 1 + (1 - atkPosMult) * 2.0
  const toChance = (avg.to ?? 0) * 0.042 * toBoost
  if (Math.random() < toChance) {
    const steal = Math.random() < (defender.avg?.stl ?? 0) * defPosMult * 0.12
    return { turnover: true, made: false, points: 0, shotType: null, specialEvent: steal ? 'steal' : null, ftMade: 0 }
  }

  const shotType = pickShotType(avg)

  if (shotType === 'FT') {
    const ftPct  = Math.min(Math.max(getFtChance(avg) * Math.sqrt(atkPosMult), 0.45), 0.95)
    const ftMade = (Math.random() < ftPct ? 1 : 0) + (Math.random() < ftPct ? 1 : 0)
    return { turnover: false, made: ftMade > 0, points: ftMade, shotType: 'FT', specialEvent: null, ftMade }
  }

  const baseChance = shotType === '3pt' ? get3ptChance(avg) : get2ptChance(avg)
  const atkPower   = (attacker.offenseRating ?? 80) * atkMult * atkPosMult * zoneMult * rand(0.7, 1.3)
  const defPower   = (defender.defenseRating ?? 60) * defMult * defPosMult * rand(0.7, 1.3)
  const matchupAdj = atkPower / (atkPower + defPower * 0.55)

  const hitChance = shotType === '3pt'
    ? Math.min(Math.max(baseChance * matchupAdj * 1.10, 0.15), 0.55)
    : Math.min(Math.max(baseChance * matchupAdj * 1.45, 0.20), 0.80)

  const made = Math.random() < hitChance
  let specialEvent = null
  if (!made) {
    const blkChance = (defender.avg?.blk ?? 0) * defPosMult * 0.07
    if (Math.random() < blkChance) specialEvent = 'block'
    else if (Math.random() < (attacker.avg?.reb ?? 0) * 0.03) specialEvent = 'off_reb'
  }

  return { turnover: false, made, points: made ? (shotType === '3pt' ? 3 : 2) : 0, shotType, specialEvent, ftMade: 0 }
}

// ─── Per-action energy drain ─────────────────────────────────────────────────
function calcActiveDrain(drainRate, result, role) {
  let total = drainRate * (role === 'attacker' ? 2.5 : 2.0)
  if (role === 'attacker') {
    if (result.made && result.shotType !== 'FT') total += drainRate * 2.0
    if (result.turnover)                         total += drainRate * 1.0
    if (result.specialEvent === 'steal')         total += drainRate * 1.5
    if (result.specialEvent === 'block')         total += drainRate * 1.5
  } else {
    if (result.specialEvent === 'steal') total += drainRate * 3.0
    if (result.specialEvent === 'block') total += drainRate * 3.0
  }
  return total
}

// ─── Shared inline attack helper (used by simulateGame) ──────────────────────
// Runs one possession, updates energy + box score, returns { play, pts }.
// Caller must set play.score and play.energySnapshot then push.
function _runAttackInline(
  atkTeam, atkMap, defTeam, defMap,
  teamIndex, quarter, possIdx,
  atkBoxes, defBoxes, drainMap,
  atkStreakMap
) {
  const atk = weightedPick(atkTeam,  x => (x.offenseRating + 100) * getEnergyMultiplier(atkMap[x.id]))
  const def = posMatchPick(defTeam, atk.position, x => (x.defenseRating + 80) * getEnergyMultiplier(defMap[x.id]))

  const streakBefore = atkStreakMap[atk.id] ?? 0
  const zoneMult     = getZoneMult(streakBefore)
  const result = simulatePossession(atk, def, atkMap[atk.id], defMap[def.id], zoneMult)

  atkMap[atk.id] = Math.max(0, atkMap[atk.id] - calcActiveDrain(drainMap[atk.id], result, 'attacker'))
  defMap[def.id] = Math.max(0, defMap[def.id] - calcActiveDrain(drainMap[def.id], result, 'defender'))
  for (const x of atkTeam) { if (x.id !== atk.id) atkMap[x.id] = Math.max(0, atkMap[x.id] - 0.3) }
  for (const x of defTeam) { if (x.id !== def.id) defMap[x.id] = Math.max(0, defMap[x.id] - 0.3) }

  updateBox(atkBoxes, atk.id, result, 'attacker')
  updateBox(defBoxes, def.id, result, 'defender')

  let assister = null
  if (result.made && result.shotType !== 'FT' && Math.random() < 0.60) {
    const tm = atkTeam.filter(x => x.id !== atk.id)
    if (tm.length) {
      assister = weightedPick(tm, x => Math.max(x.avg?.ast ?? 0, 0.5))
      atkBoxes[assister.id].ast++
    }
  }

  updateStreak(atkStreakMap, atk.id, result)
  const streakAfter  = atkStreakMap[atk.id]
  const zoneEntered  = getZoneEntered(streakBefore, streakAfter)

  const play = { quarter, possIdx, teamIndex, attacker: atk, defender: def, assister, ...result,
    atkEnergyAfter: Math.round(atkMap[atk.id]),
    atkZone: getZoneLabel(streakAfter), atkStreak: streakAfter, zoneEntered }
  play.description = buildDescription(play)
  return { play, pts: result.points }
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function simulateGame(myStarters, npcStartersInput, npcBenchInput = []) {
  if (!myStarters?.length || !npcStartersInput?.length) return null

  const myEnergyMap  = Object.fromEntries(myStarters.map(p => [p.id, 100]))
  const npcEnergyMap = Object.fromEntries([
    ...npcStartersInput.map(p => [p.id, 100]),
    ...npcBenchInput.map(p => [p.id, 100]),
  ])
  const drainMap = Object.fromEntries(
    [...myStarters, ...npcStartersInput, ...npcBenchInput].map(p => [p.id, getDrainRate(p)])
  )

  const myActive  = [...myStarters]
  const npcActive = [...npcStartersInput]
  const npcBench  = [...npcBenchInput]

  const myStreakMap  = Object.fromEntries(myStarters.map(p => [p.id, 0]))
  const npcStreakMap = Object.fromEntries([...npcStartersInput, ...npcBenchInput].map(p => [p.id, 0]))

  const boxScore = {
    myTeam:  Object.fromEntries(myStarters.map(p => [p.id, emptyBox()])),
    npcTeam: Object.fromEntries([...npcStartersInput, ...npcBenchInput].map(p => [p.id, emptyBox()])),
  }

  const plays = []
  const quarterScores = []
  let myTotal = 0, npcTotal = 0

  // ── Regular quarters ─────────────────────────────────────────────────────
  for (let q = 0; q < QUARTERS; q++) {
    let possIdx = 0
    let myQ = 0, npcQ = 0

    for (let p = 0; p < POSSESSIONS_PER_QUARTER; p++) {
      {
        const { play, pts } = _runAttackInline(
          myActive, myEnergyMap, npcActive, npcEnergyMap,
          0, q + 1, possIdx++, boxScore.myTeam, boxScore.npcTeam, drainMap, myStreakMap
        )
        myTotal += pts; myQ += pts
        play.score = [myTotal, npcTotal]
        play.energySnapshot = { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } }
        plays.push(play)
      }
      {
        const { play, pts } = _runAttackInline(
          npcActive, npcEnergyMap, myActive, myEnergyMap,
          1, q + 1, possIdx++, boxScore.npcTeam, boxScore.myTeam, drainMap, npcStreakMap
        )
        npcTotal += pts; npcQ += pts
        play.score = [myTotal, npcTotal]
        play.energySnapshot = { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } }
        plays.push(play)
      }
    }

    quarterScores.push([myQ, npcQ])

    // NPC subs at end of each non-final quarter
    if (q < QUARTERS - 1) {
      for (let i = 0; i < npcActive.length; i++) {
        const tired = npcActive[i]
        if (npcEnergyMap[tired.id] < SUB_THRESHOLD) {
          const subIn = npcBench.find(b => b.position === tired.position)
          if (subIn) {
            npcActive[i] = subIn
            npcBench.splice(npcBench.indexOf(subIn), 1)
            npcEnergyMap[subIn.id] = 100
            const energyLeft = Math.round(npcEnergyMap[tired.id])
            plays.push({
              isSub: true, quarter: q + 1, teamIndex: 1, subIn, subOut: tired,
              description: {
                en: `SUB (GSW): ${subIn.last_name} in for ${tired.last_name} (${energyLeft}% energy)`,
                zh: `换人 (勇士): ${subIn.last_name} 换下 ${tired.last_name}（体力剩余 ${energyLeft}%）`,
              },
              score: [myTotal, npcTotal],
              energySnapshot: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
            })
          }
        }
      }
    }
  }

  // ── Overtime: keep playing until someone wins ─────────────────────────────
  let otPeriod = 1   // OT1 = quarter 5, OT2 = quarter 6, ...
  while (myTotal === npcTotal) {
    const otQuarter = QUARTERS + otPeriod
    let myOT = 0, npcOT = 0
    let possIdx = 0

    for (let p = 0; p < OT_POSSESSIONS; p++) {
      {
        const { play, pts } = _runAttackInline(
          myActive, myEnergyMap, npcActive, npcEnergyMap,
          0, otQuarter, possIdx++, boxScore.myTeam, boxScore.npcTeam, drainMap, myStreakMap
        )
        myTotal += pts; myOT += pts
        play.score = [myTotal, npcTotal]
        play.energySnapshot = { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } }
        plays.push(play)
      }
      {
        const { play, pts } = _runAttackInline(
          npcActive, npcEnergyMap, myActive, myEnergyMap,
          1, otQuarter, possIdx++, boxScore.npcTeam, boxScore.myTeam, drainMap, npcStreakMap
        )
        npcTotal += pts; npcOT += pts
        play.score = [myTotal, npcTotal]
        play.energySnapshot = { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } }
        plays.push(play)
      }
    }

    quarterScores.push([myOT, npcOT])
    otPeriod++
  }

  return {
    plays,
    quarterScores,
    finalScore: [myTotal, npcTotal],
    winner: myTotal > npcTotal ? 'my' : myTotal < npcTotal ? 'npc' : 'tie',
    boxScore,
    finalEnergy: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
  }
}

// ─── Resume simulation after a mid-game human substitution ───────────────────
// Works for any quarter including OT (quarter > 4).
// state.quarter is the 1-indexed quarter/OT number at the pause point.
export function resumeSimulation(prefix, myLineup, npcLineup, npcBenchInput = [], state) {
  const { score, quarter } = state
  const myEnergyMap  = { ...state.myEnergies }
  const npcEnergyMap = { ...state.npcEnergies }

  for (const p of myLineup) {
    if (myEnergyMap[p.id] == null) myEnergyMap[p.id] = 100
  }
  for (const p of [...npcLineup, ...npcBenchInput]) {
    if (npcEnergyMap[p.id] == null) npcEnergyMap[p.id] = 100
  }

  const allKnown = [...myLineup, ...npcLineup, ...npcBenchInput]
  const drainMap = Object.fromEntries(allKnown.map(p => [p.id, getDrainRate(p)]))

  // Determine period type
  const isOT = quarter > QUARTERS

  // How many plays were done in periods before the current one
  const playsInPrevPeriods = isOT
    ? QUARTERS * POSSESSIONS_PER_QUARTER * 2 + (quarter - QUARTERS - 1) * OT_POSSESSIONS * 2
    : (quarter - 1) * POSSESSIONS_PER_QUARTER * 2

  const nonSubPrefix    = prefix.filter(p => !p.isSub)
  const playsInCurPeriod = nonSubPrefix.length - playsInPrevPeriods
  const posssDone        = Math.floor(playsInCurPeriod / 2)
  const npcAttacksFirst  = playsInCurPeriod % 2 === 1

  let [myTotal, npcTotal] = score

  const boxScore = {
    myTeam:  Object.fromEntries(myLineup.map(p => [p.id, emptyBox()])),
    npcTeam: Object.fromEntries([...npcLineup, ...npcBenchInput].map(p => [p.id, emptyBox()])),
  }

  const newPlays   = []
  const newQScores = []
  const myActive   = [...myLineup]
  const npcActive  = [...npcLineup]
  const npcBench   = [...npcBenchInput]

  // Derive per-player streak state from the prefix plays, in chronological order.
  // Sub events reset the subbed-out player's streak so a returning sub starts fresh.
  const myStreakMap  = {}
  const npcStreakMap = {}
  for (const play of prefix) {
    const map = play.teamIndex === 0 ? myStreakMap : npcStreakMap
    if (play.isSub) {
      if (play.subOut) map[play.subOut.id] = 0
      continue
    }
    if (play.atkStreak == null) continue
    map[play.attacker.id] = play.atkStreak
  }
  // Fill any missing players (not in prefix yet) with 0
  for (const p of myLineup) if (myStreakMap[p.id] == null) myStreakMap[p.id] = 0
  for (const p of [...npcLineup, ...npcBenchInput]) if (npcStreakMap[p.id] == null) npcStreakMap[p.id] = 0

  // qtPossIdx continues within current period, then resets for new periods
  let qtPossIdx = playsInCurPeriod  // start where prefix left off

  function runAttack(atkTeam, atkMap, defTeam, defMap, teamIndex, q) {
    const atkStreakMap = teamIndex === 0 ? myStreakMap : npcStreakMap
    const atk = weightedPick(atkTeam, x => (x.offenseRating + 100) * getEnergyMultiplier(atkMap[x.id] ?? 100))
    const def = posMatchPick(defTeam, atk.position, x => (x.defenseRating + 80) * getEnergyMultiplier(defMap[x.id] ?? 100))

    const streakBefore = atkStreakMap[atk.id] ?? 0
    const zoneMult     = getZoneMult(streakBefore)
    const result = simulatePossession(atk, def, atkMap[atk.id] ?? 100, defMap[def.id] ?? 100, zoneMult)
    const pts = result.points
    if (teamIndex === 0) myTotal += pts; else npcTotal += pts

    atkMap[atk.id] = Math.max(0, (atkMap[atk.id] ?? 100) - calcActiveDrain(drainMap[atk.id] ?? 1, result, 'attacker'))
    defMap[def.id] = Math.max(0, (defMap[def.id] ?? 100) - calcActiveDrain(drainMap[def.id] ?? 1, result, 'defender'))
    for (const x of atkTeam) if (x.id !== atk.id) atkMap[x.id] = Math.max(0, (atkMap[x.id] ?? 100) - 0.3)
    for (const x of defTeam) if (x.id !== def.id) defMap[x.id] = Math.max(0, (defMap[x.id] ?? 100) - 0.3)

    const atkBox = teamIndex === 0 ? boxScore.myTeam  : boxScore.npcTeam
    const defBox = teamIndex === 0 ? boxScore.npcTeam : boxScore.myTeam
    updateBox(atkBox, atk.id, result, 'attacker')
    updateBox(defBox, def.id, result, 'defender')

    let assister = null
    if (result.made && result.shotType !== 'FT' && Math.random() < 0.60) {
      const tm = atkTeam.filter(x => x.id !== atk.id)
      if (tm.length) {
        assister = weightedPick(tm, x => Math.max(x.avg?.ast ?? 0, 0.5))
        atkBox[assister.id].ast++
      }
    }

    updateStreak(atkStreakMap, atk.id, result)
    const streakAfter = atkStreakMap[atk.id]
    const zoneEntered = getZoneEntered(streakBefore, streakAfter)

    const play = {
      quarter: q + 1, possIdx: qtPossIdx++, teamIndex,
      attacker: atk, defender: def, assister, ...result,
      atkEnergyAfter: Math.round(atkMap[atk.id]),
      atkZone: getZoneLabel(streakAfter), atkStreak: streakAfter, zoneEntered,
      score: [myTotal, npcTotal],
      energySnapshot: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
    }
    play.description = buildDescription(play)
    newPlays.push(play)
    return pts
  }

  // ── Regular quarters (only when resuming within Q1-Q4) ───────────────────
  if (!isOT) {
    for (let q = quarter - 1; q < QUARTERS; q++) {
      // First quarter: continue from where we paused; subsequent: start fresh
      if (q !== quarter - 1) { qtPossIdx = 0 }

      let myQ = 0, npcQ = 0
      const startPoss = q === quarter - 1 ? posssDone : 0

      for (let p = startPoss; p < POSSESSIONS_PER_QUARTER; p++) {
        if (p === startPoss && npcAttacksFirst && q === quarter - 1) {
          npcQ += runAttack(npcActive, npcEnergyMap, myActive, myEnergyMap, 1, q)
        } else {
          myQ  += runAttack(myActive, myEnergyMap, npcActive, npcEnergyMap, 0, q)
          npcQ += runAttack(npcActive, npcEnergyMap, myActive, myEnergyMap, 1, q)
        }
      }
      newQScores.push([myQ, npcQ])

      // NPC subs between regular quarters
      if (q < QUARTERS - 1) {
        for (let i = 0; i < npcActive.length; i++) {
          const tired = npcActive[i]
          if (npcEnergyMap[tired.id] < SUB_THRESHOLD) {
            const subIn = npcBench.find(b => b.position === tired.position)
            if (subIn) {
              npcActive[i] = subIn
              npcBench.splice(npcBench.indexOf(subIn), 1)
              npcEnergyMap[subIn.id] = 100
              const energyLeft = Math.round(npcEnergyMap[tired.id])
              newPlays.push({
                isSub: true, quarter: q + 1, teamIndex: 1, subIn, subOut: tired,
                description: {
                  en: `SUB (GSW): ${subIn.last_name} in for ${tired.last_name} (${energyLeft}% energy)`,
                  zh: `换人 (勇士): ${subIn.last_name} 换下 ${tired.last_name}（体力剩余 ${energyLeft}%）`,
                },
                score: [myTotal, npcTotal],
                energySnapshot: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
              })
            }
          }
        }
      }
    }
  }

  // ── OT: finish current OT period (if resuming mid-OT) ───────────────────
  if (isOT) {
    // qtPossIdx already set to playsInCurPeriod above
    let myOT = 0, npcOT = 0
    for (let p = posssDone; p < OT_POSSESSIONS; p++) {
      if (p === posssDone && npcAttacksFirst) {
        npcOT += runAttack(npcActive, npcEnergyMap, myActive, myEnergyMap, 1, quarter - 1)
      } else {
        myOT  += runAttack(myActive, myEnergyMap, npcActive, npcEnergyMap, 0, quarter - 1)
        npcOT += runAttack(npcActive, npcEnergyMap, myActive, myEnergyMap, 1, quarter - 1)
      }
    }
    newQScores.push([myOT, npcOT])
  }

  // ── Keep playing OT until there's a winner ───────────────────────────────
  // nextOtQuarter: the next OT period number to play if still tied
  let nextOtQuarter = isOT ? quarter + 1 : QUARTERS + 1
  while (myTotal === npcTotal) {
    qtPossIdx = 0
    let myOT = 0, npcOT = 0
    for (let p = 0; p < OT_POSSESSIONS; p++) {
      myOT  += runAttack(myActive, myEnergyMap, npcActive, npcEnergyMap, 0, nextOtQuarter - 1)
      npcOT += runAttack(npcActive, npcEnergyMap, myActive, myEnergyMap, 1, nextOtQuarter - 1)
    }
    newQScores.push([myOT, npcOT])
    nextOtQuarter++
  }

  // ── Build full quarter/period score array ────────────────────────────────
  // Unified: prefix periods (from prefix plays) + current period + subsequent periods
  const fullQScores = []

  // All periods before the current one — sum from prefix
  for (let q = 1; q < quarter; q++) {
    const qPlays = prefix.filter(p => !p.isSub && p.quarter === q)
    let mq = 0, nq = 0
    for (const play of qPlays) { if (play.teamIndex === 0) mq += play.points; else nq += play.points }
    fullQScores.push([mq, nq])
  }

  // Current period: prefix portion + first new score
  const curPrefixPlays = prefix.filter(p => !p.isSub && p.quarter === quarter)
  let mq = 0, nq = 0
  for (const play of curPrefixPlays) { if (play.teamIndex === 0) mq += play.points; else nq += play.points }
  const [nm, nn] = newQScores[0] ?? [0, 0]
  fullQScores.push([mq + nm, nq + nn])

  // Subsequent periods (Q{quarter+1} through Q4, plus any OT periods)
  for (let i = 1; i < newQScores.length; i++) fullQScores.push(newQScores[i])

  return {
    plays: [...prefix, ...newPlays],
    quarterScores: fullQScores,
    finalScore: [myTotal, npcTotal],
    winner: myTotal > npcTotal ? 'my' : myTotal < npcTotal ? 'npc' : 'tie',
    boxScore,
    finalEnergy: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
  }
}
