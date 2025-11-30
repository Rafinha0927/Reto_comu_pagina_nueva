import PotreeViewer from "../components/PotreeViewer"
import { useWebSocket } from "../hooks/useWebSocket"
import { useState } from "react"
import SensorModal from "../components/SensorModal"

export default function Dashboard() {
  const latestData = useWebSocket()
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null)

  return (
    <div className="relative w-full h-screen">
      <PotreeViewer latestData={latestData} onSensorClick={setSelectedSensor} />
      {selectedSensor && latestData[selectedSensor] && (
        <SensorModal
          sensorId={selectedSensor}
          data={latestData[selectedSensor]}
          onClose={() => setSelectedSensor(null)}
        />
      )}
    </div>
  )
}