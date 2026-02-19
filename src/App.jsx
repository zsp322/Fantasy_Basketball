import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import FoundationalPick from './components/FoundationalPick'
import Home from './pages/Home'
import Market from './pages/Market'
import MyTeam from './pages/MyTeam'
import League from './pages/League'
import { usePlayers } from './hooks/usePlayers'
import { useTeam } from './hooks/useTeam'
import { autoAssignPlayers, getSPlayers } from './utils/teamSetup'

export default function App() {
  const { players, loading } = usePlayers()
  const team = useTeam()

  function handleFoundationalPick(foundational) {
    const auto = autoAssignPlayers(players, [foundational.id])
    team.initTeam(foundational, auto)
  }

  // Show setup screen once players load and team not yet initialized
  if (!loading && !team.initialized) {
    return (
      <FoundationalPick
        sPlayers={getSPlayers(players)}
        onPick={handleFoundationalPick}
      />
    )
  }

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
        <Navbar />
        <div className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/market" element={<Market players={players} team={team} />} />
            <Route path="/team" element={<MyTeam team={team} />} />
            <Route path="/league" element={<League />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
