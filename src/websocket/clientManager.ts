import { WebSocket } from 'ws';

export interface ClientMeta {
  socket: WebSocket;
  uuid: string | null;
  channels: Set<string>;
  userId?: number;
  role?: string;
  isAlive: boolean;
}

export const clients: ClientMeta[] = [];

export function registerClient(ws: WebSocket): ClientMeta {
  const client: ClientMeta = {
    socket: ws,
    uuid: null,
    channels: new Set(['notifications']),
    isAlive: true
  };
  clients.push(client);
  return client;
}

export function removeClient(ws: WebSocket) {
  const index = clients.findIndex(c => c.socket === ws);
  if (index !== -1) clients.splice(index, 1);
}

export function getClient(ws: WebSocket): ClientMeta | undefined {
  return clients.find(c => c.socket === ws);
}
