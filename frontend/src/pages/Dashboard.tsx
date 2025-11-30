import { useEffect, useState } from 'react'
import PotreeViewer from '../components/PotreeViewer'
import SensorModal from '../components/SensorModal'

export default function Dashboard() {
  const [latestData, setLatestData] = useState<Record<string, any>>({})
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null)


  useEffect(() => {
    // Fetch initial data
    fetch('/api/sensors')
      .then(res => res.json())
      .then(data => setLatestData(data))
      .catch(err => console.error('Error fetching sensors:', err))

    // WebSocket connection
    const ws = new WebSocket('ws://localhost:3000/api/sensors')
    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      setLatestData((prev: Record<string, any>) => ({ ...prev, [data.sensorId]: data }))
    }

    return () => ws.close()
  }, [])

  return (
    <div>
      <PotreeViewer 
        latestData={latestData} 
        onSensorClick={setSelectedSensor}
      />
      <SensorModal 
        sensorId={selectedSensor}
        sensorData={selectedSensor ? latestData[selectedSensor] : null}
        onClose={() => setSelectedSensor(null)}
      />
    </div>
  )
}