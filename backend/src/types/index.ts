export interface SensorData {
  sensorId: string;
  temperature: number;
  humidity: number;
  timestamp: number;
  receivedAt: string;
}

export interface SensorReading {
  sensorId: string;
  temperature: number;
  humidity: number;
  timestamp: number;
  receivedAt: string;
}