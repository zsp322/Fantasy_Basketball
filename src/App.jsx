import { useMemo } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import FoundationalPick from './components/FoundationalPick'
import Home from './pages/Home'
import Market from './pages/Market'
import MyTeam from './pages/MyTeam'
import League from './pages/League'
import Simulate from './pages/Simulate'
import { usePlayers } from './hooks/usePlayers'
import { useTeam } from './hooks/useTeam'
import { autoAssignPlayers, getSPlayers } from './utils/teamSetup'
import { SettingsProvider } from './contexts/SettingsContext'

function AppInner() {
  const { players, loading } = usePlayers()
  const team = useTeam()

  // Stable 5-player S/S- pick list — re-generated only when players load
  const sPlayers = useMemo(() => getSPlayers(players), [players])

  function handleFoundationalPick(foundational) {
    const auto = autoAssignPlayers(players, [foundational.id])
    team.initTeam(foundational, auto)
  }

  // Show setup screen once players load and team not yet initialized
  if (!loading && !team.initialized) {
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
            <Route path="/market" element={<Market players={players} team={team} />} />
            <Route path="/team" element={<MyTeam team={team} />} />
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
