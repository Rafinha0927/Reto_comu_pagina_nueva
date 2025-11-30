import { useEffect, useState } from 'react'
import HistoryChart from '../components/HistoryChart'

export default function History() {
  const [data, setData] = useState<any[]>([])
  const [selectedSensor, setSelectedSensor] = useState('sensor-01')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const endTime = Math.floor(Date.now() / 1000)
    const startTime = endTime - 86400 // últimas 24 horas

    fetch(`/api/sensors/${selectedSensor}/readings?start=${startTime}&end=${endTime}&limit=1000`)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error('Error fetching history:', err))
      .finally(() => setLoading(false))
  }, [selectedSensor])

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Historial de Datos</h1>
      
      <div className="mb-8">
        <label className="text-white block mb-2">Seleccionar Sensor:</label>
        <select 
          value={selectedSensor}
          onChange={(e) => setSelectedSensor(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          <option value="sensor-01">Sensor 01 - Esquina Delantera Izquierda</option>
          <option value="sensor-02">Sensor 02 - Esquina Delantera Derecha</option>
          <option value="sensor-03">Sensor 03 - Esquina Trasera Izquierda</option>
          <option value="sensor-04">Sensor 04 - Esquina Trasera Derecha</option>
        </select>
      </div>

      {loading ? (
        <div className="text-white">Cargando datos...</div>
      ) : (
        <HistoryChart data={data} />
      )}
    </div>
  )
}
