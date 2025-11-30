import React from 'react'

interface SensorTableProps {
  data: any[]
  sensorId: string
}

export default function SensorTable({ data, sensorId }: SensorTableProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-6">
      <h2 className="text-white text-xl font-bold mb-4">Datos Detallados - {sensorId}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-4">Timestamp</th>
              <th className="text-left py-2 px-4">Temperatura (°C)</th>
              <th className="text-left py-2 px-4">Humedad (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((item, idx) => (
              <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="py-2 px-4">{new Date(item.receivedAt).toLocaleString()}</td>
                <td className="py-2 px-4">{item.temperature.toFixed(1)}</td>
                <td className="py-2 px-4">{item.humidity.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
