import { NavLink } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

const links = [
  { to: '/', label: { en: 'Home', zh: '主页' } },
  { to: '/market', label: { en: 'Market', zh: '市场' } },
  { to: '/team', label: { en: 'My Team', zh: '我的队' } },
  { to: '/simulate', label: { en: 'Simulate', zh: '模拟' } },
  { to: '/league', label: { en: 'League', zh: '联赛' } },
]

export default function Navbar() {
  const { lang, theme, toggleLang, toggleTheme } = useSettings()

  const isLight = theme === 'light'

  return (
    <nav
      className="border-b flex items-center gap-5 px-5 py-3 flex-shrink-0"
      style={{
        background: 'var(--bg-nav)',
        borderColor: 'var(--bg-nav-border)',
      }}
    >
      {/* Brand */}
      <span
        className="font-bold text-base mr-2 shrink-0 text-orange-400"
      >
        范特西篮球
      </span>

      {/* Nav links */}
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            isActive
              ? 'text-orange-400 font-semibold text-sm'
              : 'text-sm transition-colors'
          }
          style={({ isActive }) => isActive ? {} : {
            color: 'var(--text-secondary)',
          }}
        >
          {label[lang] ?? label.en}
        </NavLink>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border"
        style={{
          background: 'var(--bg-card-inner)',
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        {lang === 'zh' ? '中 → EN' : 'EN → 中'}
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isLight ? '切换暗色模式' : 'Switch to light mode'}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors border"
        style={{
          background: 'var(--bg-card-inner)',
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          fontSize: 16,
        }}
      >
        {isLight ? '🌙' : '☀️'}
      </button>
    </nav>
  )
}
