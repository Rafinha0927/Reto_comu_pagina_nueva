import { Router } from "express";
import { saveReading, getLatestReadings, getReadingsBySensor } from "../services/dynamodb";
import { WSServer } from "../websocket/wsServer";

const router = Router();
let wsServer: WSServer;

export const setWSServer = (server: WSServer) => {
  wsServer = server;
};

router.post("/data", async (req, res) => {
  const { sensorId, temperature, humidity } = req.body;

  if (!["sensor-01", "sensor-02", "sensor-03", "sensor-04"].includes(sensorId)) {
    return res.status(400).json({ error: "Invalid sensorId" });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const receivedAt = new Date().toISOString();

  const item = {
    sensorId,
    timestamp,
    temperature: Number(temperature.toFixed(1)),
    humidity: Number(humidity.toFixed(1)),
    receivedAt,
  };

  try {
    await saveReading(item);
    wsServer.broadcast(item);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save" });
  }
});

router.get("/", async (req, res) => {
  const latest = await getLatestReadings();
  res.json(latest);
});

router.get("/:id/readings", async (req, res) => {
  const { id } = req.params;
  const { start, end, limit } = req.query;

  const data = await getReadingsBySensor(
    id,
    start ? Number(start) : undefined,
    end ? Number(end) : undefined,
    limit ? Number(limit) : 1000
  );

  res.json(data);
});

export default router;