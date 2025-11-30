import { useEffect, useState } from 'react'
import RealTimeCards from '../components/RealTimeCards'

export default function Realtime() {
  const [latestData, setLatestData] = useState<Record<string, any>>({})

  useEffect(() => {
    // Fetch initial data
    fetch('/api/sensors')
      .then(res => res.json())
      .then(data => setLatestData(data))
      .catch(err => console.error('Error fetching sensors:', err))

    // WebSocket connection
    const ws = new WebSocket('ws://localhost:3000/api/sensors')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLatestData(prev => ({ ...prev, [data.sensorId]: data }))
    }

    return () => ws.close()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Monitoreo en Tiempo Real</h1>
      <RealTimeCards data={latestData} />
    </div>
  )
}
