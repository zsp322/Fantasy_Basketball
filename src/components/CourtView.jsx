import PlayerSlotCard from './PlayerSlotCard'

// Position slots on the court (x, y as % of court container)
const SLOTS = [
  { pos: 'PG', x: 50, y: 16 },
  { pos: 'SG', x: 80, y: 44 },
  { pos: 'SF', x: 20, y: 44 },
  { pos: 'PF', x: 67, y: 74 },
  { pos: 'C',  x: 33, y: 74 },
]

export default function CourtView({ starters, onSlotClick }) {
  return (
    <div className="relative w-full h-full">

      {/* Arena atmosphere glow */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(251,146,60,0.15) 0%, rgba(0,0,0,0) 70%)' }}
      />

      {/* Hardwood court */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden border border-amber-900/40"
        style={{
          background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 40px), linear-gradient(180deg, #7c3810 0%, #a0490f 30%, #b85213 50%, #a0490f 70%, #7c3810 100%)',
        }}
      >
        {/* Court lines */}
        {/* Half court line */}
        <div className="absolute left-0 right-0 border-t border-amber-100/20" style={{ top: '50%' }} />

        {/* Center circle */}
        <div className="absolute border border-amber-100/20 rounded-full"
          style={{ width: '18%', aspectRatio: '1', left: '41%', top: '41%' }}
        />

        {/* Paint / key — top */}
        <div className="absolute border border-amber-100/20 rounded-t-full"
          style={{ width: '28%', height: '28%', left: '36%', top: 0 }}
        />

        {/* Paint / key — bottom */}
        <div className="absolute border border-amber-100/20 rounded-b-full"
          style={{ width: '28%', height: '28%', left: '36%', bottom: 0 }}
        />

        {/* 3pt arc — top */}
        <div className="absolute border border-amber-100/15 rounded-b-full"
          style={{ width: '60%', height: '40%', left: '20%', top: '-20%' }}
        />

        {/* 3pt arc — bottom */}
        <div className="absolute border border-amber-100/15 rounded-t-full"
          style={{ width: '60%', height: '40%', left: '20%', bottom: '-20%' }}
        />
      </div>

      {/* Player slots */}
      {SLOTS.map(slot => {
        const player = starters[slot.pos] ?? null
        return (
          <div
            key={slot.pos}
            className="absolute"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <PlayerSlotCard
              pos={slot.pos}
              player={player}
              onClick={() => onSlotClick(slot.pos, player)}
            />
          </div>
        )
      })}
    </div>
  )
}
