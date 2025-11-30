import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface HistoryChartProps {
  data: any[]
}

export default function HistoryChart({ data }: HistoryChartProps) {
  const chartData = data.map(item => ({
    timestamp: new Date(item.receivedAt).toLocaleTimeString(),
    temperature: item.temperature,
    humidity: item.humidity,
  }))

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-white text-xl font-bold mb-4">Gráfico de Datos</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="timestamp" 
            stroke="#999"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#999"
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="temperature" 
            stroke="#ef4444" 
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="humidity" 
            stroke="#3b82f6" 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
