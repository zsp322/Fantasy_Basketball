import { useSettings } from '../contexts/SettingsContext'
import { T, t } from '../data/i18n'

export default function Home() {
  const { lang } = useSettings()
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-white"
      style={{ background: 'var(--bg-app)' }}
    >
      <h1 className="text-5xl font-bold mb-2">范特西篮球</h1>
      <p className="text-gray-400 text-lg">{t(T.home.subtitle, lang)}</p>
    </div>
  )
}
