import { useMemo, useState } from 'react'

// Version guard — clears stale localStorage for users on versions before 1.0.9.
// After 1.0.9, we rely on per-feature cache key bumps instead of nuking all data.
;(function enforceVersion() {
  const VERSION_KEY = 'fbball_version'
  const CLEAR_BELOW  = '1.0.9'
  const stored = localStorage.getItem(VERSION_KEY)

  function versionBelow(v, min) {
    if (!v) return true
    const [ma, mi, pa] = v.split('.').map(Number)
    const [mma, mmi, mpa] = min.split('.').map(Number)
    if (ma !== mma) return ma < mma
    if (mi !== mmi) return mi < mmi
    return pa < mpa
  }

  if (versionBelow(stored, CLEAR_BELOW)) {
    const lang  = localStorage.getItem('fbball_lang')
    const theme = localStorage.getItem('fbball_theme')
    localStorage.clear()
    if (lang)  localStorage.setItem('fbball_lang',  lang)
    if (theme) localStorage.setItem('fbball_theme', theme)
    window.location.reload()
  }

  localStorage.setItem(VERSION_KEY, __APP_VERSION__)
})()
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import FoundationalPick from './components/FoundationalPick'
import TeamReveal from './components/TeamReveal'
import Home from './pages/Home'
import Market from './pages/Market'
import MyTeam from './pages/MyTeam'
import League from './pages/League'
import Simulate from './pages/Simulate'
import { usePlayers } from './hooks/usePlayers'
import { useTeam } from './hooks/useTeam'
import { useSalaryChanges } from './hooks/useSalaryChanges'
import { autoAssignPlayers, getSPlayers } from './utils/teamSetup'
import { SettingsProvider } from './contexts/SettingsContext'

function AppInner() {
  const { players, loading } = usePlayers()
  const team = useTeam()
  const { winners, losers, salaryMap, updatedAt } = useSalaryChanges(players)
  const [pendingInit, setPendingInit] = useState(null) // { foundational, autoPlayers }

  // Stable 5-player S/S- pick list — re-generated only when players load
  const sPlayers = useMemo(() => getSPlayers(players), [players])

  function handleFoundationalPick(foundational) {
    const auto = autoAssignPlayers(players, [foundational.id])
    setPendingInit({ foundational, autoPlayers: auto })
  }

  function handleRevealConfirm() {
    team.initTeam(pendingInit.foundational, pendingInit.autoPlayers)
    setPendingInit(null)
  }

  function generateAuto() {
    return autoAssignPlayers(players, [pendingInit.foundational.id])
  }

  // Show setup screens once players load and team not yet initialized
  if (!loading && !team.initialized) {
    if (pendingInit) {
      return (
        <TeamReveal
          foundational={pendingInit.foundational}
          initialAutoPlayers={pendingInit.autoPlayers}
          onConfirm={handleRevealConfirm}
          generateAuto={generateAuto}
        />
      )
    }
    return (
      <FoundationalPick
        sPlayers={sPlayers}
        onPick={handleFoundationalPick}
      />
    )
  }

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-app)' }}>
        <Navbar />
        <div className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/market" element={<Market players={players} team={team} winners={winners} losers={losers} salaryMap={salaryMap} updatedAt={updatedAt} />} />
            <Route path="/team" element={<MyTeam team={team} salaryMap={salaryMap} />} />
            <Route path="/league" element={<League />} />
            <Route path="/simulate" element={<Simulate />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  )
}
