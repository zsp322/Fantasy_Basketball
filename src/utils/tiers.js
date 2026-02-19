export const TIERS = [
  { name: 'S+', salary: 42, floor: 35, ceiling: 50, slots: 4,   color: 'bg-yellow-400 text-black' },
  { name: 'S',  salary: 36, floor: 28, ceiling: 44, slots: 8,   color: 'bg-yellow-300 text-black' },
  { name: 'S-', salary: 30, floor: 23, ceiling: 38, slots: 12,  color: 'bg-yellow-200 text-black' },
  { name: 'A+', salary: 25, floor: 19, ceiling: 31, slots: 16,  color: 'bg-green-400 text-black' },
  { name: 'A',  salary: 20, floor: 15, ceiling: 26, slots: 20,  color: 'bg-green-300 text-black' },
  { name: 'A-', salary: 16, floor: 12, ceiling: 21, slots: 24,  color: 'bg-green-200 text-black' },
  { name: 'B+', salary: 13, floor: 9,  ceiling: 17, slots: 28,  color: 'bg-blue-400 text-white' },
  { name: 'B',  salary: 10, floor: 7,  ceiling: 13, slots: 32,  color: 'bg-blue-300 text-black' },
  { name: 'B-', salary: 7,  floor: 5,  ceiling: 10, slots: 40,  color: 'bg-blue-200 text-black' },
  { name: 'C+', salary: 5,  floor: 3,  ceiling: 7,  slots: 50,  color: 'bg-purple-400 text-white' },
  { name: 'C',  salary: 3.5,floor: 2,  ceiling: 5,  slots: 60,  color: 'bg-purple-300 text-black' },
  { name: 'C-', salary: 2,  floor: 1,  ceiling: 3.5,slots: 80,  color: 'bg-purple-200 text-black' },
  { name: 'D+', salary: 1.5,floor: 0.8,ceiling: 2.5,slots: 100, color: 'bg-gray-400 text-black' },
  { name: 'D',  salary: 1,  floor: 0.5,ceiling: 2,  slots: 120, color: 'bg-gray-300 text-black' },
  { name: 'D-', salary: 0.7,floor: 0.3,ceiling: 1.5,slots: 150, color: 'bg-gray-200 text-black' },
  { name: 'F',  salary: 0.5,floor: 0.3,ceiling: 1,  slots: Infinity, color: 'bg-gray-100 text-black' },
]

export function assignTiers(playersWithScores) {
  // Only rank players with meaningful minutes
  const qualified = playersWithScores
    .filter(p => (p.avg?.min ?? 0) >= 10)
    .sort((a, b) => b.fantasyScore - a.fantasyScore)

  const result = []
  let assigned = 0

  for (const tier of TIERS) {
    const limit = tier.slots === Infinity ? qualified.length : tier.slots
    const slice = qualified.slice(assigned, assigned + limit)
    slice.forEach(p => result.push({ ...p, tier }))
    assigned += slice.length
    if (assigned >= qualified.length) break
  }

  // Players with too few minutes get F tier
  playersWithScores
    .filter(p => (p.avg?.min ?? 0) < 10)
    .forEach(p => result.push({ ...p, tier: TIERS[TIERS.length - 1] }))

  return result
}

export function getTierByName(name) {
  return TIERS.find(t => t.name === name) ?? TIERS[TIERS.length - 1]
}
