import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import sensorsRouter, { setWSServer } from "./routes/sensors";
import { WSServer } from "./websocket/wsServer";
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// API
app.use("/api/sensors", sensorsRouter);

// WebSocket
const wsServer = new WSServer(server);
setWSServer(wsServer);

// Todas las demás rutas → frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});