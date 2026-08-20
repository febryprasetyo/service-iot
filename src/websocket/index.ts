import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { registerClient, removeClient, getClient } from './clientManager';
import { broadcastMonitoring, sendMonitoringNow } from './broadcaster';
import { decodeToken, isValidateToken, logger } from '../utils/util';

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws: WSWebSocket, req: any) => {
    const client = registerClient(ws);
    console.log('[WEBSOCKET] Client connected');

    // Auto-subscribe from URL path: /monitoring/:uuid
    if (req.url && req.url.startsWith('/monitoring/')) {
      const parts = req.url.split('/');
      const uuid = parts[2];
      
      if (uuid) {
        client.uuid = uuid;
        client.channels.add(`monitoring:${uuid}`);
        console.log(`[WEBSOCKET] Client auto-subscribed to monitoring:${uuid} via URL`);
        ws.send(JSON.stringify({ type: 'info', message: `Subscribed to ${uuid}` }));
        
        try {
          await sendMonitoringNow(ws, uuid);
        } catch (err) {
          console.error('[WEBSOCKET] Error sending initial data:', err);
        }
      }
    }

    // Ping-Pong event from client
    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('message', async (msg: string) => {
      try {
        const payload = JSON.parse(msg.toString());
        const { type } = payload;

        if (type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // Authentication handshake
        if (type === 'auth' && payload.token) {
          try {
            const isValid = await isValidateToken(payload.token);
            if (isValid) {
              const decoded = await decodeToken(payload.token);
              if (decoded?.userData) {
                client.userId = decoded.userData.user_id || decoded.userData.id;
                client.role = decoded.userData.role_id || decoded.userData.role;
                ws.send(JSON.stringify({ type: 'auth_success', message: 'Authenticated successfully' }));
              }
            }
          } catch (authErr) {
            console.error('[WEBSOCKET] Auth error:', authErr);
          }
          return;
        }

        // Channel subscriptions
        if (type === 'subscribe') {
          if (payload.channels && Array.isArray(payload.channels)) {
            for (const ch of payload.channels) {
              client.channels.add(ch);
            }
            ws.send(JSON.stringify({ type: 'info', message: `Subscribed to channels: ${payload.channels.join(', ')}` }));
          }

          if (payload.uuid) {
            client.uuid = payload.uuid;
            client.channels.add(`monitoring:${payload.uuid}`);
            ws.send(JSON.stringify({ type: 'info', message: `Subscribed to ${payload.uuid}` }));
            await sendMonitoringNow(ws, payload.uuid);
          }
          return;
        }

        if (type === 'unsubscribe' && payload.channel) {
          client.channels.delete(payload.channel);
          ws.send(JSON.stringify({ type: 'info', message: `Unsubscribed from ${payload.channel}` }));
          return;
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      removeClient(ws);
      console.log('[WEBSOCKET] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WEBSOCKET] Socket error:', err);
      removeClient(ws);
    });
  });

  // Heartbeat ping interval to clean dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WSWebSocket) => {
      const client = getClient(ws);
      if (client) {
        if (!client.isAlive) {
          removeClient(ws);
          return ws.terminate();
        }
        client.isAlive = false;
        ws.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Kirim update berkala monitoring ke semua client
  setInterval(broadcastMonitoring, 60000);
}
