import { Request, Response } from 'express';
import {
  db,
} from '../utils/util';
import moment from 'moment';
import { time } from 'console';



class DataMonitoringController {
  private cache: any = null;
  private cacheTimestamp: number = 0;

  // === MONITORING DETAIL ===
  async handlerMonitoring(req: Request, res: Response) {
    try {
      const now = Date.now();
      let uuidParam = req.query.uuid;
      let uuid: string[] | undefined = undefined;

      if (typeof uuidParam === 'string') {
        uuid = [uuidParam];
      } else if (Array.isArray(uuidParam)) {
        uuid = uuidParam as string[];
      }

      let id_stasiun = req.query.id_stasiun as string | undefined;
      const user_id = req.body.user_id;
      const role_id = req.body.role_id;

      let allowedUuids: string[] = [];

      if (role_id !== 'adm') {
        const rows = await db('devices as d')
          .leftJoin('users as u', 'd.dinas_id', 'u.id')
          .where('u.id', user_id)
          .pluck('d.id_mesin');

        allowedUuids = rows;

        if (!uuid) {
          uuid = allowedUuids;
        }
      }

      const rows = await db
        .raw(
          `
          SELECT DISTINCT ON (id_stasiun) 
            uuid, id, id_stasiun, temperature, do_, tur, ct, ph, orp, bod, cod, 
            tss, n, no3_3, no2, depth, time
          FROM mqtt_datas
          ORDER BY id_stasiun, time DESC
        `
        )
        .then((result: { rows: any }) => result.rows);

      const nowMoment = moment();
      const result = rows.map((item: any) => {
        const lastUpdate = moment(item.time);
        const minutesDiff = nowMoment.diff(lastUpdate, 'minutes');
        const status = minutesDiff <= 5 ? 'hidup' : 'mati';

        return {
          uuid: item.uuid,
          id: item.id,
          id_stasiun: item.id_stasiun,
          temperature: item.temperature,
          do: item.do_,
          tur: item.tur,
          ct: item.ct,
          ph: item.ph,
          orp: item.orp,
          bod: item.bod,
          cod: item.cod,
          tss: item.tss,
          n: item.n,
          no3_3: item.no3_3,
          no2: item.no2,
          depth: item.depth,
          status,
          minutesDiff,
          time: moment(item.time).format('DD/MM/YYYY HH:mm:ss'),
        };
      });

      const filtered = this.applyFilter(
      result,
      uuid,
      id_stasiun,
      allowedUuids,
      role_id
    );
    const sorted = this.sortByStasiun(filtered);

    // Hitung status hidup/mati
    const hidupCount = sorted.filter((x) => x.status === 'hidup').length;
    const matiCount = sorted.filter((x) => x.status === 'mati').length;

    res.json({
      success: true,
      total: sorted.length,
      Hidup: hidupCount,
      Mati: matiCount,
      data: sorted,
    });
    } catch (error: any) {
    console.error('❌ Error in handlerMonitoring:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  // === STATUS SAJA ===
  async handlerStatus(req: Request, res: Response) {
    try {
      const rows = await db
        .raw(
          `
          SELECT DISTINCT ON (id_stasiun) 
            uuid, id_stasiun, time
          FROM mqtt_datas
          ORDER BY id_stasiun, time DESC
        `
        )
        .then((result: { rows: any }) => result.rows);

      const nowMoment = moment();
      const result = rows.map((item: any) => {
        const lastUpdate = moment(item.time);
        const minutesDiff = nowMoment.diff(lastUpdate, 'minutes');
        const status = minutesDiff <= 5 ? 'hidup' : 'mati';

        return {
          uuid: item.uuid,
          id_stasiun: item.id_stasiun,
          status,
          minutesDiff,
          time: moment(item.time).format('DD/MM/YYYY HH:mm:ss'),
        };
      });

       // Hitung status hidup/mati
        const hidupCount = result.filter((x: { status: string; }) => x.status === 'hidup').length;
        const matiCount = result.filter((x: { status: string; }) => x.status === 'mati').length;
       res.json({
      success: true,
      total: result.length,
      Hidup: hidupCount,
      Mati: matiCount,
      data: result,
      });
    } catch (error: any) {
      console.error('❌ Error in handlerStatus:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  // === UTIL ===
  private applyFilter(
    data: any[],
    uuid?: string | string[],
    id_stasiun?: string,
    allowedUuids: string[] = [],
    role_id?: string
  ): any[] {
    return data.filter((item) => {
      const matchUuid = uuid
        ? Array.isArray(uuid)
          ? uuid.includes(item.uuid)
          : item.uuid === uuid
        : role_id === 'adm' || allowedUuids.includes(item.uuid);

      const matchStasiun = id_stasiun ? item.id_stasiun === id_stasiun : true;
      return matchUuid && matchStasiun;
    });
  }

  private sortByStasiun(data: any[]): any[] {
    return data.sort((a, b) => a.id_stasiun.localeCompare(b.id_stasiun));
  }
}

export const DataMonitoringCtl = new DataMonitoringController();