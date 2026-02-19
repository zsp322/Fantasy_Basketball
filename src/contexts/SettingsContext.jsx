import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  // Defaults: dark theme, Chinese language
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('fbball_theme') ?? 'dark'
  )
  const [lang, setLangState] = useState(
    () => localStorage.getItem('fbball_lang') ?? 'zh'
  )

  // Apply theme class to <html> and persist
  useEffect(() => {
    const html = document.documentElement
    if (theme === 'light') {
      html.classList.add('light-theme')
    } else {
      html.classList.remove('light-theme')
    }
    localStorage.setItem('fbball_theme', theme)
  }, [theme])

  // Persist lang
  useEffect(() => {
    localStorage.setItem('fbball_lang', lang)
  }, [lang])

  function setTheme(t) { setThemeState(t) }
  function setLang(l)  { setLangState(l) }
  function toggleTheme() { setThemeState(t => t === 'dark' ? 'light' : 'dark') }
  function toggleLang()  { setLangState(l => l === 'zh' ? 'en' : 'zh') }

  return (
    <SettingsContext.Provider value={{ theme, lang, setTheme, setLang, toggleTheme, toggleLang }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
