import { pickPlayText } from '../data/playTexts.js'

// ─── Constants ───────────────────────────────────────────────────────────────
const QUARTERS = 4
const POSSESSIONS_PER_QUARTER = 20  // per team → 80/team total

// Energy sub threshold: if a player drops below this at quarter end, sub them out
const SUB_THRESHOLD = 38

// ─── Position mismatch ────────────────────────────────────────────────────────
// Penalty when a player starts in the wrong position slot.
// e.g. a C playing PG → only 20% effective; SG playing SF → 85%.
const POS_IDX = { PG: 0, SG: 1, SF: 2, PF: 3, C: 4 }

// eligiblePositions: optional array of all slots the player can fill without penalty.
// If slotPos is in that list → no penalty. Otherwise use minimum distance from any eligible slot.
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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
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

// 80% chance: match by position (using eligible positions array), else weighted by defense
function posMatchPick(players, pos, weightFn) {
  if (Math.random() < 0.80) {
    const same = players.find(p => (p.positions ?? [p.position]).includes(pos))
    if (same) return same
  }
  return weightedPick(players, weightFn)
}

// ─── Energy ──────────────────────────────────────────────────────────────────
// Higher avg minutes = slower drain (iron-man conditioning).
// Scale: ~38-min star → 0.55/play,  ~20-min bench piece → 1.5/play
function getDrainRate(player) {
  const min = player.avg?.min ?? 20
  return Math.max(0.55, 2.5 - (min / 40) * 2.0)
}

export function getEnergyMultiplier(energy) {
  if (energy >= 70) return 1.00   // full strength
  if (energy >= 50) return 0.85   // getting winded
  if (energy >= 30) return 0.68   // noticeably tired
  return 0.50                     // gassed — significant drop-off
}

function getEnergyLabel(energy) {
  if (energy >= 70) return null
  if (energy >= 50) return '(tired)'
  if (energy >= 30) return '(very tired)'
  return '(EXHAUSTED)'
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
// Returns { en, zh } with player names already substituted in.
function buildDescription(play) {
  const atk    = play.attacker.last_name
  const def    = play.defender?.last_name ?? ''
  const tired  = getEnergyLabel(play.atkEnergyAfter)
  const texts  = pickPlayText(play)

  // Energy labels bilingual
  const tiredEn = tired ? ` ${tired}` : ''
  const tiredZh = tired === '(tired)'      ? '（体力下降）'
                : tired === '(very tired)' ? '（十分疲惫）'
                : tired === '(EXHAUSTED)'  ? '（精疲力竭）' : ''

  let en = texts.en.replace('{atk}', `${atk}${tiredEn}`).replace('{def}', def)
  let zh = texts.zh.replace('{atk}', `${atk}${tiredZh}`).replace('{def}', def)

  // Append FT result
  if (play.shotType === 'FT') {
    const ftResultEn = `${play.ftMade}/2 FT`
    const ftResultZh = play.ftMade === 2 ? '两罚全中' : play.ftMade === 1 ? '一中一失' : '两球落空'
    en = `${en} — ${ftResultEn}`
    zh = `${zh} — ${ftResultZh}`
  }

  return { en, zh }
}

// ─── Box score ────────────────────────────────────────────────────────────────
function emptyBox() {
  return { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fga: 0, fgm: 0, fg3a: 0, fg3m: 0, fta: 0, ftm: 0 }
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
    if (!result.made && !result.turnover && result.specialEvent !== 'steal') {
      if (Math.random() < 0.70) e.reb++
    }
  }
  if (role === 'attacker' && result.specialEvent === 'off_reb') e.reb++
}

// ─── Core possession simulator ───────────────────────────────────────────────
function simulatePossession(attacker, defender, atkEnergy, defEnergy) {
  const atkMult    = getEnergyMultiplier(atkEnergy)
  const defMult    = getEnergyMultiplier(defEnergy)

  // Position mismatch: player in wrong slot loses effectiveness
  const atkPosMult = getPosMismatchMult(attacker.position, attacker.playingAs, attacker.positions)
  const defPosMult = getPosMismatchMult(defender.position, defender.playingAs, defender.positions)

  const avg = attacker.avg ?? {}

  // Turnover — out-of-position players turn it over more often
  const toBoost  = 1 + (1 - atkPosMult) * 2.0   // C at PG → 2.6× more TOs
  const toChance = (avg.to ?? 0) * 0.042 * toBoost
  if (Math.random() < toChance) {
    const steal = Math.random() < (defender.avg?.stl ?? 0) * defPosMult * 0.12
    return { turnover: true, made: false, points: 0, shotType: null, specialEvent: steal ? 'steal' : null, ftMade: 0 }
  }

  const shotType = pickShotType(avg)

  // Free throws — position matters less at the line
  if (shotType === 'FT') {
    const ftPct = Math.min(Math.max(getFtChance(avg) * Math.sqrt(atkPosMult), 0.45), 0.95)
    const ft1   = Math.random() < ftPct
    const ft2   = Math.random() < ftPct
    const ftMade = (ft1 ? 1 : 0) + (ft2 ? 1 : 0)
    return { turnover: false, made: ftMade > 0, points: ftMade, shotType: 'FT', specialEvent: null, ftMade }
  }

  // Field goal — attacker vs defender, both affected by position mismatch
  const baseChance = shotType === '3pt' ? get3ptChance(avg) : get2ptChance(avg)
  const atkPower   = (attacker.offenseRating ?? 80) * atkMult * atkPosMult * rand(0.7, 1.3)
  const defPower   = (defender.defenseRating ?? 60) * defMult * defPosMult * rand(0.7, 1.3)
  const matchupAdj = atkPower / (atkPower + defPower * 0.55)

  let hitChance
  if (shotType === '3pt') {
    hitChance = Math.min(Math.max(baseChance * matchupAdj * 1.10, 0.15), 0.55)
  } else {
    hitChance = Math.min(Math.max(baseChance * matchupAdj * 1.45, 0.20), 0.80)
  }

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
// Returns total energy cost for the active player based on what happened.
// drainRate is the player-specific base rate (faster for low-minute players).
function calcActiveDrain(drainRate, result, role) {
  // Base drain per possession — faster than before
  let total = drainRate * (role === 'attacker' ? 2.5 : 2.0)

  if (role === 'attacker') {
    if (result.made && result.shotType !== 'FT') total += drainRate * 2.0  // scoring effort
    if (result.turnover)                         total += drainRate * 1.0  // fumble/stumble
    if (result.specialEvent === 'steal')         total += drainRate * 1.5  // got stripped
    if (result.specialEvent === 'block')         total += drainRate * 1.5  // absorb contact
  } else {
    // defender
    if (result.specialEvent === 'steal') total += drainRate * 3.0  // explosive lunge
    if (result.specialEvent === 'block') total += drainRate * 3.0  // vertical contest
  }

  return total
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function simulateGame(myStarters, npcStartersInput, npcBenchInput = []) {
  if (!myStarters?.length || !npcStartersInput?.length) return null

  // Energy tracked by player ID — handles subs cleanly
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

  const boxScore = {
    myTeam:  Object.fromEntries(myStarters.map(p => [p.id, emptyBox()])),
    npcTeam: Object.fromEntries([...npcStartersInput, ...npcBenchInput].map(p => [p.id, emptyBox()])),
  }

  const plays = []
  const quarterScores = []
  let myTotal = 0, npcTotal = 0

  for (let q = 0; q < QUARTERS; q++) {
    let myQ = 0, npcQ = 0

    for (let p = 0; p < POSSESSIONS_PER_QUARTER; p++) {

      // ── My team attacks ──────────────────────────────────────────────────
      {
        const atk = weightedPick(myActive,  x => (x.offenseRating + 100) * getEnergyMultiplier(myEnergyMap[x.id]))
        const def = posMatchPick(npcActive, atk.position, x => (x.defenseRating + 80) * getEnergyMultiplier(npcEnergyMap[x.id]))

        const result = simulatePossession(atk, def, myEnergyMap[atk.id], npcEnergyMap[def.id])
        myTotal += result.points; myQ += result.points

        // Per-action drain (attacker + defender), scaled by each player's rate
        myEnergyMap[atk.id]  = Math.max(0, myEnergyMap[atk.id]  - calcActiveDrain(drainMap[atk.id], result, 'attacker'))
        npcEnergyMap[def.id] = Math.max(0, npcEnergyMap[def.id] - calcActiveDrain(drainMap[def.id], result, 'defender'))
        // Passive drain for everyone else on the court
        for (const x of myActive)  { if (x.id !== atk.id) myEnergyMap[x.id]  = Math.max(0, myEnergyMap[x.id]  - 0.3) }
        for (const x of npcActive) { if (x.id !== def.id) npcEnergyMap[x.id] = Math.max(0, npcEnergyMap[x.id] - 0.3) }

        updateBox(boxScore.myTeam,  atk.id, result, 'attacker')
        updateBox(boxScore.npcTeam, def.id, result, 'defender')
        if (result.made && result.shotType !== 'FT' && Math.random() < 0.60) {
          const tm = myActive.filter(x => x.id !== atk.id)
          if (tm.length) boxScore.myTeam[pick(tm).id].ast++
        }

        const play = {
          quarter: q + 1, teamIndex: 0,
          attacker: atk, defender: def, ...result,
          atkEnergyAfter: Math.round(myEnergyMap[atk.id]),
          score: [myTotal, npcTotal],
          energySnapshot: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
        }
        play.description = buildDescription(play)
        plays.push(play)
      }

      // ── NPC team attacks ─────────────────────────────────────────────────
      {
        const atk = weightedPick(npcActive, x => (x.offenseRating + 100) * getEnergyMultiplier(npcEnergyMap[x.id]))
        const def = posMatchPick(myActive,  atk.position, x => (x.defenseRating + 80) * getEnergyMultiplier(myEnergyMap[x.id]))

        const result = simulatePossession(atk, def, npcEnergyMap[atk.id], myEnergyMap[def.id])
        npcTotal += result.points; npcQ += result.points

        npcEnergyMap[atk.id] = Math.max(0, npcEnergyMap[atk.id] - calcActiveDrain(drainMap[atk.id], result, 'attacker'))
        myEnergyMap[def.id]  = Math.max(0, myEnergyMap[def.id]  - calcActiveDrain(drainMap[def.id], result, 'defender'))
        for (const x of npcActive) { if (x.id !== atk.id) npcEnergyMap[x.id] = Math.max(0, npcEnergyMap[x.id] - 0.3) }
        for (const x of myActive)  { if (x.id !== def.id) myEnergyMap[x.id]  = Math.max(0, myEnergyMap[x.id]  - 0.3) }

        updateBox(boxScore.npcTeam, atk.id, result, 'attacker')
        updateBox(boxScore.myTeam,  def.id, result, 'defender')
        if (result.made && result.shotType !== 'FT' && Math.random() < 0.60) {
          const tm = npcActive.filter(x => x.id !== atk.id)
          if (tm.length) boxScore.npcTeam[pick(tm).id].ast++
        }

        const play = {
          quarter: q + 1, teamIndex: 1,
          attacker: atk, defender: def, ...result,
          atkEnergyAfter: Math.round(npcEnergyMap[atk.id]),
          score: [myTotal, npcTotal],
          energySnapshot: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
        }
        play.description = buildDescription(play)
        plays.push(play)
      }
    }

    quarterScores.push([myQ, npcQ])

    // ── NPC substitutions at end of each quarter (not after last quarter) ──
    if (q < QUARTERS - 1) {
      for (let i = 0; i < npcActive.length; i++) {
        const tired = npcActive[i]
        if (npcEnergyMap[tired.id] < SUB_THRESHOLD) {
          const subIn = npcBench.find(b => b.position === tired.position)
          if (subIn) {
            npcActive[i] = subIn
            npcBench.splice(npcBench.indexOf(subIn), 1)
            npcEnergyMap[subIn.id] = 100  // fresh legs

            const energyLeft = Math.round(npcEnergyMap[tired.id])
            plays.push({
              isSub: true,
              quarter: q + 1,
              teamIndex: 1,
              subIn,
              subOut: tired,
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
// prefix    : plays already revealed (kept as-is)
// myLineup  : updated 5-player array (new player already swapped in)
// npcLineup : current NPC active players at the pause point
// npcBenchInput : remaining NPC bench
// state     : { score:[my,npc], quarter:1-4, myEnergies:{}, npcEnergies:{} }
export function resumeSimulation(prefix, myLineup, npcLineup, npcBenchInput = [], state) {
  const { score, quarter } = state
  const myEnergyMap  = { ...state.myEnergies }
  const npcEnergyMap = { ...state.npcEnergies }

  // Any new player (just subbed in by the human) starts with fresh-ish legs
  for (const p of myLineup) {
    if (myEnergyMap[p.id] == null) myEnergyMap[p.id] = 80
  }
  for (const p of [...npcLineup, ...npcBenchInput]) {
    if (npcEnergyMap[p.id] == null) npcEnergyMap[p.id] = 100
  }

  const allKnown = [...myLineup, ...npcLineup, ...npcBenchInput]
  const drainMap = Object.fromEntries(allKnown.map(p => [p.id, getDrainRate(p)]))

  // Determine where we are inside the current quarter
  const nonSubPrefix  = prefix.filter(p => !p.isSub)
  const playsInPrevQs = (quarter - 1) * POSSESSIONS_PER_QUARTER * 2
  const playsInCurQ   = nonSubPrefix.length - playsInPrevQs
  const posssDoneInCurQ = Math.floor(playsInCurQ / 2)
  const npcAttacksFirst = playsInCurQ % 2 === 1  // odd → my team already attacked, NPC is next

  let [myTotal, npcTotal] = score

  const boxScore = {
    myTeam:  Object.fromEntries(myLineup.map(p => [p.id, emptyBox()])),
    npcTeam: Object.fromEntries([...npcLineup, ...npcBenchInput].map(p => [p.id, emptyBox()])),
  }

  const newPlays = []
  const newQScores = []

  const myActive  = [...myLineup]
  const npcActive = [...npcLineup]
  const npcBench  = [...npcBenchInput]

  // Helper: run one team's attack and push a play
  function runAttack(atkTeam, atkMap, defTeam, defMap, teamIndex, q) {
    const atk = weightedPick(atkTeam, x => (x.offenseRating + 100) * getEnergyMultiplier(atkMap[x.id] ?? 100))
    const def = posMatchPick(defTeam, atk.position, x => (x.defenseRating + 80) * getEnergyMultiplier(defMap[x.id] ?? 100))

    const result = simulatePossession(atk, def, atkMap[atk.id] ?? 100, defMap[def.id] ?? 100)
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
    if (result.made && result.shotType !== 'FT' && Math.random() < 0.60) {
      const tm = atkTeam.filter(x => x.id !== atk.id)
      if (tm.length) atkBox[pick(tm).id].ast++
    }

    const play = {
      quarter: q + 1, teamIndex,
      attacker: atk, defender: def, ...result,
      atkEnergyAfter: Math.round(atkMap[atk.id]),
      score: [myTotal, npcTotal],
      energySnapshot: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
    }
    play.description = buildDescription(play)
    newPlays.push(play)
    return pts
  }

  for (let q = quarter - 1; q < QUARTERS; q++) {
    let myQ = 0, npcQ = 0
    const startPoss = q === quarter - 1 ? posssDoneInCurQ : 0

    for (let p = startPoss; p < POSSESSIONS_PER_QUARTER; p++) {
      // If resuming mid-possession (NPC still needs to attack in p=startPoss), skip my team attack for that slot
      if (p === startPoss && npcAttacksFirst && q === quarter - 1) {
        npcQ += runAttack(npcActive, npcEnergyMap, myActive, myEnergyMap, 1, q)
      } else {
        myQ  += runAttack(myActive, myEnergyMap, npcActive, npcEnergyMap, 0, q)
        npcQ += runAttack(npcActive, npcEnergyMap, myActive, myEnergyMap, 1, q)
      }
    }

    newQScores.push([myQ, npcQ])

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
              isSub: true, quarter: q + 1, teamIndex: 1,
              subIn, subOut: tired,
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

  // Build full 4-quarter score array from prefix + new plays
  const fullQScores = []
  for (let q = 0; q < QUARTERS; q++) {
    if (q < quarter - 1) {
      // Completed quarter — sum from prefix
      const qPlays = prefix.filter(p => !p.isSub && p.quarter === q + 1)
      let mq = 0, nq = 0
      for (const play of qPlays) { if (play.teamIndex === 0) mq += play.points; else nq += play.points }
      fullQScores.push([mq, nq])
    } else if (q === quarter - 1) {
      // Current quarter: existing portion + new portion
      const qPrefixPlays = prefix.filter(p => !p.isSub && p.quarter === q + 1)
      let mq = 0, nq = 0
      for (const play of qPrefixPlays) { if (play.teamIndex === 0) mq += play.points; else nq += play.points }
      const [nm, nn] = newQScores[0] ?? [0, 0]
      fullQScores.push([mq + nm, nq + nn])
    } else {
      const idx = q - (quarter - 1)
      fullQScores.push(newQScores[idx] ?? [0, 0])
    }
  }

  return {
    plays: [...prefix, ...newPlays],
    quarterScores: fullQScores,
    finalScore: [myTotal, npcTotal],
    winner: myTotal > npcTotal ? 'my' : myTotal < npcTotal ? 'npc' : 'tie',
    boxScore,
    finalEnergy: { myTeam: { ...myEnergyMap }, npcTeam: { ...npcEnergyMap } },
  }
}
