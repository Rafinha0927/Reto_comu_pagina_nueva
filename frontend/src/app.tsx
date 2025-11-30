import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import History from "./pages/History"
import RealTime from "./pages/RealTime"
import { Home, History as HistoryIcon, Activity } from "lucide-react"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900">
        {/* Navbar */}
        <nav className="bg-black/90 backdrop-blur border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-bold text-white">Salón IoT</h1>
                <div className="hidden md:flex space-x-6">
                  <NavLink to="/" className={({ isActive }) => 
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <Home size={18} /> 3D Potree
                  </NavLink>
                  <NavLink to="/realtime" className={({ isActive }) => 
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <Activity size={18} /> Tiempo Real
                  </NavLink>
                  <NavLink to="/history" className={({ isActive }) => 
                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <HistoryIcon size={18} /> Histórico
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/realtime" element={<RealTime />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App