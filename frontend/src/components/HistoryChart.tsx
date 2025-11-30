import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SensorData {
  receivedAt: string | number
  temperature: number
  humidity: number
}

interface HistoryChartProps {
  data: SensorData[]
}

export default function HistoryChart({ data }: HistoryChartProps) {
  /**
   * PROCESAR DATOS PARA EL GRÁFICO
   * ==============================
   * - Ordena por timestamp
   * - Convierte timestamps a formato legible
   * - Redondea valores numéricos
   */
  const chartData = useMemo(() => {
    return data
      .sort((a, b) => {
        const dateA = new Date(a.receivedAt).getTime()
        const dateB = new Date(b.receivedAt).getTime()
        return dateA - dateB
      })
      .map(item => ({
        timestamp: new Date(item.receivedAt).toLocaleTimeString('es-ES'),
        temperature: parseFloat(item.temperature.toFixed(1)),
        humidity: parseFloat(item.humidity.toFixed(1)),
        rawTime: new Date(item.receivedAt).getTime(),
      }))
  }, [data])

  /**
   * CALCULAR ESTADÍSTICAS
   * =====================
   * Promedio, máximo y mínimo de temperatura y humedad
   */
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { tempAvg: 0, humAvg: 0, tempMax: 0, tempMin: 0 }
    }
    
    const temps = chartData.map(d => d.temperature)
    const hums = chartData.map(d => d.humidity)
    
    return {
      tempAvg: (temps.reduce((a, b) => a + b) / temps.length).toFixed(1),
      humAvg: (hums.reduce((a, b) => a + b) / hums.length).toFixed(1),
      tempMax: Math.max(...temps).toFixed(1),
      tempMin: Math.min(...temps).toFixed(1),
    }
  }, [chartData])

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-white text-xl font-bold mb-4">Gráfico de Datos Históricos</h2>
        
        {/* TARJETAS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-gray-400 text-xs mb-1">Temp Promedio</p>
            <p className="text-red-400 font-bold text-lg">{stats.tempAvg}°C</p>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-gray-400 text-xs mb-1">Temp Máxima</p>
            <p className="text-red-500 font-bold text-lg">{stats.tempMax}°C</p>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-gray-400 text-xs mb-1">Temp Mínima</p>
            <p className="text-orange-400 font-bold text-lg">{stats.tempMin}°C</p>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-gray-400 text-xs mb-1">Humedad Promedio</p>
            <p className="text-blue-400 font-bold text-lg">{stats.humAvg}%</p>
          </div>
        </div>
      </div>

      {/* GRÁFICO O MENSAJE SIN DATOS */}
      {chartData.length > 0 ? (
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
              label={{ value: '°C / %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: any) => value.toFixed(2)}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="temperature" 
              stroke="#ef4444" 
              dot={false}
              isAnimationActive={false}
              name="Temperatura (°C)"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="humidity" 
              stroke="#3b82f6" 
              dot={false}
              isAnimationActive={false}
              name="Humedad (%)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-96 flex items-center justify-center text-gray-400 border border-gray-700 rounded">
          <p>No hay datos disponibles para mostrar</p>
        </div>
      )}
    </div>
  )
}
