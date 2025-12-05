import moment from 'moment';
import { db } from '../utils/util';
import { clients } from './clientManager';
import { WebSocket as WSWebSocket } from 'ws';

const isPositive = (val: any) => {
  const num = parseFloat(val);
  return !isNaN(num) && num > 0;
};

const isPositiveStrict = (val: any) => {
  const num = parseFloat(val);
  return !isNaN(num) && num > 0.001;
};

export async function broadcastMonitoring() {
  const now = moment();

  for (const client of clients) {
    if (!client.uuid || client.socket.readyState !== client.socket.OPEN) continue;

    const row = await db('sensor_data').where({ uuid: client.uuid }).first();
    if (!row) continue;

    let id_stasiun = row.id_stasiun;
    if (!id_stasiun) {
      const device = await db('devices').where({ id_mesin: client.uuid }).first();
      id_stasiun = device?.id_stasiun || '-';
    }

    const lastUpdate = moment(row.time);
    const isAlive = now.diff(lastUpdate, 'minutes') <= 15;
    const status = isAlive ? 'hidup' : 'mati';

    const y4000_status = (isPositiveStrict(row.do_) || isPositiveStrict(row.ph) || isPositiveStrict(row.ct) || isPositiveStrict(row.tur)) ? 'on' : 'off';
    const uv254_status = (isPositive(row.cod) || isPositive(row.tss)) ? 'on' : 'off';
    const nh4_status = isPositive(row.n) ? 'on' : 'off';
    const depth_status = isPositive(row.depth) ? 'on' : 'off';
    const no2_status = isPositive(row.no2) ? 'on' : 'off';
    const no3_status = isPositive(row.no3_3) ? 'on' : 'off';

    const payload = {
      uuid: row.uuid,
      id_stasiun: id_stasiun,
      time: row.time,
      status: status,
      y4000_status,
      uv254_status,
      nh4_status,
      depth_status,
      no2_status,
      no3_status,
      temperature: row.temperature,
      do_: row.do_,
      ph: row.ph,
      tur: row.tur,
      bod: row.bod,
      cod: row.cod,
      tss: row.tss,
      depth: row.depth,
      no3_3: row.no3_3,
      n: row.n,
      ct: row.ct,
      no2: row.no2,
      orp: row.orp,
      pump_status: row.pump_status,
      cv_status: row.cv_status,
      read_status: row.read_status
    };

    client.socket.send(JSON.stringify({ type: 'monitoring', data: payload }));
  }
}

export async function sendMonitoringNow(ws: WSWebSocket, uuid: string) {
  const now = moment();
  const row = await db('sensor_data').where({ uuid }).first();
  
  if (!row) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Tidak ada data pada stasiun dengan UUID ${uuid}`
    }));
    return;
  }

  let id_stasiun = row.id_stasiun;
  if (!id_stasiun) {
    const device = await db('devices').where({ id_mesin: uuid }).first();
    id_stasiun = device?.id_stasiun || '-';
  }

  const lastUpdate = moment(row.time);
  const isAlive = now.diff(lastUpdate, 'minutes') <= 15;
  const status = isAlive ? 'hidup' : 'mati';

  const y4000_status = (isPositiveStrict(row.do_) || isPositiveStrict(row.ph) || isPositiveStrict(row.ct) || isPositiveStrict(row.tur)) ? 'on' : 'off';
  const uv254_status = (isPositive(row.cod) || isPositive(row.tss)) ? 'on' : 'off';
  const nh4_status = isPositive(row.n) ? 'on' : 'off';
  const depth_status = isPositive(row.depth) ? 'on' : 'off';
  const no2_status = isPositive(row.no2) ? 'on' : 'off';
  const no3_status = isPositive(row.no3_3) ? 'on' : 'off';

  const payload = {
    uuid: row.uuid,
    id_stasiun: id_stasiun,
    time: row.time,
    status: status,
    y4000_status,
    uv254_status,
    nh4_status,
    depth_status,
    no2_status,
    no3_status,
    temperature: row.temperature,
    do_: row.do_,
    ph: row.ph,
    tur: row.tur,
    bod: row.bod,
    cod: row.cod,
    tss: row.tss,
    depth: row.depth,
    no3_3: row.no3_3,
    n: row.n,
    ct: row.ct,
    no2: row.no2,
    orp: row.orp,
    pump_status: row.pump_status,
    cv_status: row.cv_status,
    read_status: row.read_status
  };

  ws.send(JSON.stringify({ type: 'monitoring', data: payload }));
}
