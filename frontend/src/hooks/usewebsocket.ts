import { useEffect, useRef, useState } from "react";

const WS_URL = import.meta.env.PROD 
  ? `wss://${window.location.host}` 
  : "ws://localhost:3000";

export const useWebSocket = () => {
  const [latestData, setLatestData] = useState<Record<string, any>>({});
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => console.log("WS Connected");
      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "sensor_update") {
          setLatestData(prev => ({
            ...prev,
            [msg.data.sensorId]: msg.data
          }));
        }
      };
      ws.current.onclose = () => setTimeout(connect, 3000);
    };

    connect();
    return () => ws.current?.close();
  }, []);

  return latestData;
};