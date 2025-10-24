import { WebSocket } from 'ws';

export interface ClientMeta {
  socket: WebSocket;
  uuid: string | null;
}

export const clients: ClientMeta[] = [];

export function registerClient(ws: WebSocket) {
  const client: ClientMeta = { socket: ws, uuid: null };
  clients.push(client);
  return client;
}

export function removeClient(ws: WebSocket) {
  const index = clients.findIndex(c => c.socket === ws);
  if (index !== -1) clients.splice(index, 1);
}
