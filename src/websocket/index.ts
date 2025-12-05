import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { registerClient, removeClient } from './clientManager';
import { broadcastMonitoring, sendMonitoringNow } from './broadcaster';

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws: WSWebSocket, req: any) => {
    const client = registerClient(ws);
    console.log('WebSocket client connected');

    // Auto-subscribe from URL path: /monitoring/:uuid
    if (req.url && req.url.startsWith('/monitoring/')) {
      const parts = req.url.split('/');
      const uuid = parts[2]; // ["", "monitoring", "uuid"]
      
      if (uuid) {
        client.uuid = uuid;
        console.log(`Client auto-subscribed to ${uuid} via URL`);
        ws.send(JSON.stringify({ type: 'info', message: `Subscribed to ${uuid}` }));
        
        // Kirim data awal langsung
        try {
          await sendMonitoringNow(ws, uuid);
        } catch (err) {
          console.error('Error sending initial data:', err);
        }
      }
    }

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
