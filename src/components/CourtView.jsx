import PlayerSlotCard from './PlayerSlotCard'

const SLOTS = [
  { pos: 'PG', x: 33, y: 18 },  // top row — guards
  { pos: 'SG', x: 67, y: 18 },
  { pos: 'SF', x: 16, y: 50 },  // middle row — forwards (wide)
  { pos: 'PF', x: 84, y: 50 },
  { pos: 'C',  x: 50, y: 70 },  // bottom center — near paint
]

export default function CourtView({ starters, onSlotClick, onHoverPlayer, onDragStart, onDropSlot, dragOverPos, onDragOverSlot }) {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        // Arena outer shell — dark stadium feel
        background: 'linear-gradient(180deg, #04040f 0%, #0c050a 18%, #1a0800 35%, #0a0400 50%)',
      }}
    >
      {/* Crowd / bleachers suggestion at top */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: '22%',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(40,20,80,0.6) 0%, rgba(20,10,40,0.4) 40%, transparent 80%), ' +
            'linear-gradient(180deg, rgba(8,6,20,0.95) 0%, rgba(12,8,20,0.6) 60%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* Crowd dots pattern — subtle texture suggesting audience */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: '18%',
          backgroundImage:
            'radial-gradient(circle, rgba(255,200,100,0.08) 1px, transparent 1px)',
          backgroundSize: '18px 14px',
          zIndex: 1,
        }}
      />

      {/* Arena spotlight from above */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% -5%, rgba(255,160,60,0.18) 0%, rgba(255,140,30,0.06) 35%, transparent 65%)',
          zIndex: 2,
        }}
      />

      {/* Hardwood court — occupies the lower ~82% of the space */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{
          top: '12%',
          background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0.035) 1px, transparent 1px, transparent 38px), ' +
            'linear-gradient(180deg, #6b2e08 0%, #92400a 25%, #b45309 50%, #92400a 75%, #6b2e08 100%)',
          borderTop: '2px solid rgba(180,83,9,0.5)',
          zIndex: 2,
        }}
      >
        {/* Half-court line */}
        <div
          className="absolute left-0 right-0 border-t border-amber-100/20"
          style={{ top: '50%' }}
        />

        {/* Center circle */}
        <div
          className="absolute border border-amber-100/25 rounded-full"
          style={{ width: '16%', aspectRatio: '1', left: '42%', top: '42%' }}
        />

        {/* Paint — top */}
        <div
          className="absolute border border-amber-100/20"
          style={{ width: '26%', height: '26%', left: '37%', top: 0, borderTop: 'none' }}
        />

        {/* Paint — bottom */}
        <div
          className="absolute border border-amber-100/20"
          style={{ width: '26%', height: '26%', left: '37%', bottom: 0, borderBottom: 'none' }}
        />

        {/* 3pt arc — top */}
        <div
          className="absolute border border-amber-100/15 rounded-b-full"
          style={{ width: '56%', height: '38%', left: '22%', top: '-18%' }}
        />

        {/* 3pt arc — bottom */}
        <div
          className="absolute border border-amber-100/15 rounded-t-full"
          style={{ width: '56%', height: '38%', left: '22%', bottom: '-18%' }}
        />

        {/* Center court logo glow */}
        <div
          className="absolute"
          style={{
            width: '20%',
            aspectRatio: '1',
            left: '40%',
            top: '40%',
            background: 'radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Side ambient glow — left */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: '12%',
          background: 'linear-gradient(to right, rgba(5,10,30,0.5) 0%, transparent 100%)',
          zIndex: 3,
        }}
      />

      {/* Side ambient glow — right */}
      <div
        className="absolute inset-y-0 right-0"
        style={{
          width: '12%',
          background: 'linear-gradient(to left, rgba(5,10,30,0.5) 0%, transparent 100%)',
          zIndex: 3,
        }}
      />

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
              zIndex: 10,
            }}
            onDragOver={e => { e.preventDefault(); onDragOverSlot?.(slot.pos) }}
            onDrop={e => onDropSlot?.(slot.pos, e)}
          >
            <PlayerSlotCard
              pos={slot.pos}
              player={player}
              onClick={() => onSlotClick(slot.pos, player)}
              onHoverPlayer={onHoverPlayer}
              onDragStart={e => onDragStart?.(slot.pos, player, e)}
              isDragOver={dragOverPos === slot.pos}
            />
          </div>
        )
      })}
    </div>
  )
}
