import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Realtime from './pages/Realtime'
import History from './pages/History'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/realtime" element={<Realtime />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  )
}
