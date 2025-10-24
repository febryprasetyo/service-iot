import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { registerClient, removeClient } from './clientManager';
import { broadcastMonitoring, sendMonitoringNow } from './broadcaster';

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WSWebSocket) => {
    const client = registerClient(ws);
    console.log('WebSocket client connected');

    ws.on('message', async (msg: string) => {
      try {
        const { type, uuid } = JSON.parse(msg);
        if (type === 'subscribe' && uuid) {
          client.uuid = uuid;
          ws.send(JSON.stringify({ type: 'info', message: `Subscribed to ${uuid}` }));

          // 🔥 Kirim data langsung saat subscribe
          await sendMonitoringNow(ws, uuid);
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid format' }));
      }
    });

    ws.on('close', () => {
      removeClient(ws);
      console.log('WebSocket client disconnected');
    });
  });

  // ⏱️ Kirim update berkala ke semua client
  setInterval(broadcastMonitoring, 60000);
}
