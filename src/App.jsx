import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Market from './pages/Market'
import MyTeam from './pages/MyTeam'
import League from './pages/League'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/team" element={<MyTeam />} />
          <Route path="/league" element={<League />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
