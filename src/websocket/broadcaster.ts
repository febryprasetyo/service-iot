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

import { getMonitoringDataWithStatus } from '../utils/statusHelper';

export async function broadcastMonitoring() {
  const now = moment();

  for (const client of clients) {
    if (!client.uuid || client.socket.readyState !== client.socket.OPEN) continue;

    // Use mqtt_monitoring table for consistency with Controller?
    // Controller used 'mqtt_monitoring', but broadcaster uses 'sensor_data'.
    // Assuming 'sensor_data' is the source for real-time. 
    // Wait, statusHelper expects object with fields like temperature, do_, etc.
    // Let's stick to 'sensor_data' for websocket if that's what was used, but ensure keys match.
    // Or better, switch to mqtt_monitoring if that's the "Monitoring" source of truth.
    // Checking `MonitoringController`: it uses `mqtt_monitoring`.
    // Checking `broadcaster`: it uses `sensor_data`.
    // They might be sync, but `mqtt_monitoring` implies "Current State".
    // I will stick to `sensor_data` but ensure field mapping match helper expectation.
    // Helper expects: temperature, do_, ph, tur, bod, cod, tss, depth, no3_3, n, ct, no2, orp.
    // `sensor_data` has these.
    
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

    // Invoke Helper
    const result = await getMonitoringDataWithStatus(client.uuid, row, isAlive);
    // Handle potential null result if something weird happens, though helper handles missing data check
    const { sensors, ika } = result || { sensors: {}, ika: {} };

    // Use raw values from row (original MQTT) but positive-sanitized (except ORP), and statuses from helper
    const sanitize = (val: any) => {
        const num = parseFloat(val);
        // If it's NaN, return original val (or 0?), assuming original for now.
        // If < 0, return 0. Else return val.
        if (isNaN(num)) return val;
        return num < 0 ? 0 : num;
    };
    
    // Helper specifically for values that are already fixed strings or numbers
    const getVal = (val: any, allowNegative = false) => {
        if (allowNegative) return val;
        return sanitize(val);
    };

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
      
      temperature: getVal(row.temperature),
      status_temperature: sensors.status_temperature,

      do_: getVal(row.do_),
      status_do: sensors.status_do,

      tur: getVal(row.tur),
      status_tur: sensors.status_tur,

      ph: getVal(row.ph),
      status_ph: sensors.status_ph,

      bod: getVal(row.bod),
      status_bod: sensors.status_bod,

      cod: getVal(row.cod),
      status_cod: sensors.status_cod,

      tss: getVal(row.tss),
      status_tss: sensors.status_tss,

      depth: getVal(row.depth),
      status_depth: sensors.status_depth,

      no3_3: getVal(row.no3_3),
      status_no3_3: sensors.status_no3_3,

      n: getVal(row.n),
      status_n: sensors.status_n,

      ct: getVal(row.ct),
      status_ct: sensors.status_ct,

      no2: getVal(row.no2),
      status_no2: sensors.status_no2,

      orp: getVal(row.orp, true), // Allow negative for ORP
      status_orp: sensors.status_orp,

      pump_status: row.pump_status,
      cv_status: row.cv_status,
      read_status: row.read_status,
      
      ika: ika // Include IKA in payload
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

  // Invoke Helper
  const result = await getMonitoringDataWithStatus(uuid, row, isAlive);
  const { sensors, ika } = result || { sensors: {}, ika: {} };

   // Use raw values from row (original MQTT) but positive-sanitized (except ORP), and statuses from helper
   const sanitize = (val: any) => {
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      return num < 0 ? 0 : num;
    };
    
    const getVal = (val: any, allowNegative = false) => {
        if (allowNegative) return val;
        return sanitize(val);
    };

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
    
    temperature: getVal(row.temperature),
    status_temperature: sensors.status_temperature,

    do_: getVal(row.do_),
    status_do: sensors.status_do,

    tur: getVal(row.tur),
    status_tur: sensors.status_tur,

    ph: getVal(row.ph),
    status_ph: sensors.status_ph,

    bod: getVal(row.bod),
    status_bod: sensors.status_bod,

    cod: getVal(row.cod),
    status_cod: sensors.status_cod,

    tss: getVal(row.tss),
    status_tss: sensors.status_tss,

    depth: getVal(row.depth),
    status_depth: sensors.status_depth,

    no3_3: getVal(row.no3_3),
    status_no3_3: sensors.status_no3_3,

    n: getVal(row.n),
    status_n: sensors.status_n,

    ct: getVal(row.ct),
    status_ct: sensors.status_ct,

    no2: getVal(row.no2),
    status_no2: sensors.status_no2,

    orp: getVal(row.orp, true), // Allow negative for ORP
    status_orp: sensors.status_orp,

    pump_status: row.pump_status,
    cv_status: row.cv_status,
    read_status: row.read_status,

    ika: ika // Include IKA in payload
  };

  ws.send(JSON.stringify({ type: 'monitoring', data: payload }));
}
