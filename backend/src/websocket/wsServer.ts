import { WebSocketServer, WebSocket } from "ws";

export class WSServer {
  private wss: WebSocketServer;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("Client connected via WebSocket");
      ws.send(JSON.stringify({ type: "connected", message: "Welcome" }));

      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });
  }

  broadcast(data: any) {
    const message = JSON.stringify({ type: "sensor_update", data });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}