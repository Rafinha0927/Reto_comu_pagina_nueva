import React from "react";

interface SensorModalProps {
  sensorId: string | null;
  sensorData: any;
  onClose: () => void;
}

const SENSOR_NAMES: Record<string, string> = {
  "sensor-01": "Esquina Noroeste",
  "sensor-02": "Esquina Noreste",
  "sensor-03": "Esquina Suroeste",
  "sensor-04": "Esquina Sureste",
};

export default function SensorModal({ sensorId, sensorData, onClose }: SensorModalProps) {
  if (!sensorId) return null;

  const temp = sensorData?.temperature ?? "N/A";
  const humidity = sensorData?.humidity ?? "N/A";
  const timestamp = sensorData?.receivedAt ? new Date(sensorData.receivedAt).toLocaleString() : "N/A";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{SENSOR_NAMES[sensorId] || sensorId}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Temperatura</p>
            <p className="text-3xl font-bold text-blue-600">{temp}°C</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Humedad</p>
            <p className="text-3xl font-bold text-green-600">{humidity}%</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Última actualización</p>
            <p className="text-sm font-mono text-gray-700">{timestamp}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
