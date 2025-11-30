import React from 'react'

interface RealTimeCardsProps {
  data: Record<string, any>
}

const SENSOR_NAMES: Record<string, string> = {
  'sensor-01': 'Esquina Delantera Izquierda',
  'sensor-02': 'Esquina Delantera Derecha',
  'sensor-03': 'Esquina Trasera Izquierda',
  'sensor-04': 'Esquina Trasera Derecha',
}

export default function RealTimeCards({ data }: RealTimeCardsProps) {
  const getTemperatureColor = (temp: number) => {
    if (temp < 18) return 'text-blue-500'
    if (temp < 24) return 'text-green-500'
    if (temp < 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(SENSOR_NAMES).map(([sensorId, name]) => {
        const sensorData = data[sensorId] || {}
        const temp = sensorData.temperature ?? 'N/A'
        const humidity = sensorData.humidity ?? 'N/A'

        return (
          <div key={sensorId} className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-white font-bold mb-4">{name}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Temperatura</p>
                <p className={`text-3xl font-bold ${getTemperatureColor(temp as number)}`}>
                  {temp}°C
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Humedad</p>
                <p className="text-2xl font-bold text-cyan-500">{humidity}%</p>
              </div>
              <p className="text-gray-500 text-xs">
                {sensorData.receivedAt ? new Date(sensorData.receivedAt).toLocaleTimeString() : 'Sin datos'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
