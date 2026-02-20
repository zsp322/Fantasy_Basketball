export const TIERS = [
  { name: 'S+', salary: 70,  floor: 58, ceiling: 83, slots: 4,   color: 'bg-purple-500 text-white' },
  { name: 'S',  salary: 60,  floor: 47, ceiling: 73, slots: 8,   color: 'bg-purple-400 text-white' },
  { name: 'S-', salary: 50,  floor: 38, ceiling: 63, slots: 12,  color: 'bg-purple-300 text-black' },
  { name: 'A+', salary: 42,  floor: 32, ceiling: 52, slots: 16,  color: 'bg-blue-500 text-white' },
  { name: 'A',  salary: 33,  floor: 25, ceiling: 43, slots: 20,  color: 'bg-blue-400 text-white' },
  { name: 'A-', salary: 27,  floor: 20, ceiling: 35, slots: 24,  color: 'bg-blue-300 text-black' },
  { name: 'B+', salary: 22,  floor: 15, ceiling: 28, slots: 28,  color: 'bg-teal-500 text-white' },
  { name: 'B',  salary: 17,  floor: 12, ceiling: 22, slots: 32,  color: 'bg-teal-400 text-black' },
  { name: 'B-', salary: 12,  floor: 8,  ceiling: 17, slots: 40,  color: 'bg-teal-300 text-black' },
  { name: 'C+', salary: 8,   floor: 5,  ceiling: 12, slots: 50,  color: 'bg-green-500 text-white' },
  { name: 'C',  salary: 6,   floor: 3,  ceiling: 8,  slots: 60,  color: 'bg-green-400 text-black' },
  { name: 'C-', salary: 3,   floor: 2,  ceiling: 6,  slots: 80,  color: 'bg-green-300 text-black' },
  { name: 'D+', salary: 2.5, floor: 1.3,ceiling: 4,  slots: 100, color: 'bg-gray-500 text-white' },
  { name: 'D',  salary: 1.7, floor: 0.8,ceiling: 3,  slots: 120, color: 'bg-gray-400 text-black' },
  { name: 'D-', salary: 1.2, floor: 0.5,ceiling: 2.5,slots: 150, color: 'bg-gray-300 text-black' },
  { name: 'F',  salary: 0.8, floor: 0.5,ceiling: 1.7,slots: Infinity, color: 'bg-gray-200 text-black' },
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
