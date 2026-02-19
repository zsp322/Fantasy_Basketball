import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'

export default function League() {
  const { lang } = useSettings()
  return (
    <div className="p-6 h-full text-white" style={{ background: 'var(--bg-app)' }}>
      <h1 className="text-3xl font-bold mb-4">{t(T.league.title, lang)}</h1>
      <p className="text-gray-400">{t(T.league.soon, lang)}</p>
    </div>
  )
}
