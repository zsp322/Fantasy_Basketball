import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/market', label: 'Market' },
  { to: '/team', label: 'My Team' },
  { to: '/league', label: 'League' },
]

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-6">
      <span className="text-white font-bold text-lg mr-4">范特西篮球</span>
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            isActive
              ? 'text-orange-400 font-semibold'
              : 'text-gray-400 hover:text-white transition-colors'
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
