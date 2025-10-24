import moment from 'moment';
import { db } from '../utils/util';
import { clients } from './clientManager';
import { WebSocket as WSWebSocket } from 'ws';


export async function broadcastMonitoring() {
  const now = moment();

  for (const client of clients) {
    if (!client.uuid || client.socket.readyState !== client.socket.OPEN) continue;

    const row = await db('mqtt_monitoring').where({ uuid: client.uuid }).first();
    if (!row) continue;

    const lastUpdate = moment(row.time);
    const isAlive = now.diff(lastUpdate, 'hours') <= 3;

    const payload = {
      uuid: row.uuid,
      id_stasiun: row.id_stasiun,
      time: row.time,
      status: isAlive ? 'aktif' : 'mati',
      temperature: isAlive ? row.temperature : '0',
      do_: isAlive ? row.do_ : '0',
      ph: isAlive ? row.ph : '0',
      tur: isAlive ? row.tur : '0',
      bod: isAlive ? row.bod : '0',
      cod: isAlive ? row.cod : '0',
      tss: isAlive ? row.tss : '0',
      depth: isAlive ? row.depth : '0',
      no3_3: isAlive ? row.no3_3 : '0',
      n: isAlive ? row.n : '0',
      ct: isAlive ? row.ct : '0',
      no2: isAlive ? row.no2 : '0',
      orp: isAlive ? row.orp : '0',
      pump_status: isAlive ? row.pump_status : '0',
      cv_status: isAlive ? row.cv_status : '0',
      read_status: isAlive ? row.read_status : '0'
    };

    client.socket.send(JSON.stringify({ type: 'monitoring', data: payload }));
  }
}

export async function sendMonitoringNow(ws: WSWebSocket, uuid: string) {
  const now = moment();
  const row = await db('mqtt_monitoring').where({ uuid }).first();
  if (!row) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Tidak ada data pada stasiun dengan UUID ${uuid}`
    }));
    return;
  }


  const lastUpdate = moment(row.time);
  const isAlive = now.diff(lastUpdate, 'hours') <= 3;

  const payload = {
    uuid: row.uuid,
    id_stasiun: row.id_stasiun,
    time: row.time,
    status: isAlive ? 'aktif' : 'mati',
    temperature: isAlive ? row.temperature : '0',
    do_: isAlive ? row.do_ : '0',
    ph: isAlive ? row.ph : '0',
    tur: isAlive ? row.tur : '0',
    bod: isAlive ? row.bod : '0',
    cod: isAlive ? row.cod : '0',
    tss: isAlive ? row.tss : '0',
    depth: isAlive ? row.depth : '0',
    no3_3: isAlive ? row.no3_3 : '0',
    n: isAlive ? row.n : '0',
    ct: isAlive ? row.ct : '0',
    no2: isAlive ? row.no2 : '0',
    orp: isAlive ? row.orp : '0',
    pump_status: isAlive ? row.pump_status : '0',
    cv_status: isAlive ? row.cv_status : '0',
    read_status: isAlive ? row.read_status : '0'
  };

  ws.send(JSON.stringify({ type: 'monitoring', data: payload }));
}
