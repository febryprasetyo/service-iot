import { Request, Response } from 'express';
import {
  db,
} from '../utils/util';
import moment from 'moment';
import { time } from 'console';
import { calculateIKA } from '../utils/ikaCalculator';



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

      if (role_id === 'usr') {
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

      // === ADDED: Fetch IKA Data & Append last_update ===
      const uuids = result.map((r: any) => r.uuid).filter((u: any) => u);

      if (uuids.length > 0) {
        try {
          // Fetch latest IKA per UUID
          const ikaRows = await db('hourly_sensor_data')
            .distinctOn('uuid')
            .select('uuid', 'ika_score', 'param_dominan')
            .whereIn('uuid', uuids)
            .orderBy('uuid') // required for distinctOn
            .orderBy('hour_timestamp', 'desc');

          const ikaMap = new Map();
          ikaRows.forEach((r: any) => ikaMap.set(r.uuid, r));

          result.forEach((item: any) => {
            const ika = ikaMap.get(item.uuid);
            item.ika_score = ika?.ika_score || 0;
            item.param_dominan = ika?.param_dominan || '-';
            item.last_update = item.time;
          });
        } catch (err) {
          console.error('Error fetching IKA data:', err);
          // Fallback if IKA fetch fails
          result.forEach((item: any) => {
            item.ika_score = 0;
            item.param_dominan = '-';
            item.last_update = item.time;
          });
        }
      } else {
         result.forEach((item: any) => {
            item.ika_score = 0;
            item.param_dominan = '-';
            item.last_update = item.time;
          });
      }

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
  // async handlerStatus(req: Request, res: Response) {
  //   try {
  //     const rows = await db
  //       .raw(
  //         `
  //         SELECT DISTINCT ON (id_stasiun)
  //           uuid, id_stasiun, time
  //         FROM mqtt_datas
  //         ORDER BY id_stasiun, time DESC
  //       `
  //       )
  //       .then((result: { rows: any }) => result.rows);

  //     const nowMoment = moment();
  //     const result = rows.map((item: any) => {
  //       const lastUpdate = moment(item.time);
  //       const minutesDiff = nowMoment.diff(lastUpdate, 'minutes');
  //       const status = minutesDiff <= 5 ? 'hidup' : 'mati';

  //       return {
  //         uuid: item.uuid,
  //         id_stasiun: item.id_stasiun,
  //         status,
  //         minutesDiff,
  //         time: moment(item.time).format('DD/MM/YYYY HH:mm:ss'),
  //       };
  //     });

  //      // Hitung status hidup/mati
  //       const hidupCount = result.filter((x: { status: string; }) => x.status === 'hidup').length;
  //       const matiCount = result.filter((x: { status: string; }) => x.status === 'mati').length;
  //      res.json({
  //     success: true,
  //     total: result.length,
  //     Hidup: hidupCount,
  //     Mati: matiCount,
  //     data: result,
  //     });
  //   } catch (error: any) {
  //     console.error('❌ Error in handlerStatus:', error);
  //     res.status(500).json({ success: false, message: 'Internal Server Error' });
  //   }
  // }
  async handlerStatus(req: Request, res: Response) {
  try {
    const { role_id, user_id } = req.body;

    // Ambil stasiun milik user (hanya untuk role user/usr, admin dan engineering dapat melihat semua stasiun)
    let stationQuery = db('stations as s').select('s.id', 's.nama_stasiun', 's.id_mesin', 's.instrument_status', 's.next_calibration_date');

    if (role_id === 'usr') {
      stationQuery = stationQuery
        .leftJoin('devices as d', 'd.id_mesin', 's.id_mesin')
        .leftJoin('users as u', 'd.dinas_id', 'u.id')
        .where('u.id', user_id);
    }

    const stations = await stationQuery;

    if (stations.length === 0) {
      return res.json({ success: true, total: 0, Hidup: 0, Mati: 0, data: [] });
    }

    const idMesinList = stations.map((s: any) => s.id_mesin).filter((id: any) => id);
    
    // OPTIMIZED: Use sensor_data (realtime table) instead of mqtt_datas (history table)
    const mqttRows = await db('sensor_data')
      .select('uuid', 'time')
      .whereIn('uuid', idMesinList);




    const nowMoment = moment();
    const result = stations.map((station : any) => {
      const mqtt = mqttRows.find((m : any) => m.uuid === station.id_mesin);
      const lastUpdate = mqtt?.time ? moment(mqtt.time) : null;
      const minutesDiff = lastUpdate ? nowMoment.diff(lastUpdate, 'minutes') : null;
      const status = minutesDiff !== null && minutesDiff <= 5 ? 'hidup' : 'mati';

      // Calibration Overdue Logic
      let calibration_status = 'scheduled';
      let overdue_days = 0;
      if (station.next_calibration_date) {
        const nextCal = moment(station.next_calibration_date);
        if (nowMoment.isAfter(nextCal, 'day')) {
          calibration_status = 'overdue';
          overdue_days = nowMoment.diff(nextCal, 'days');
        }
      }

      return {
        id_stasiun: station.id,
        nama_stasiun: station.nama_stasiun,
        id_mesin: station.id_mesin,
        uuid: mqtt?.uuid || null,
        status,
        instrument_status: station.instrument_status || 'NORMAL',
        next_calibration_date: station.next_calibration_date ? moment(station.next_calibration_date).format('DD MMM YYYY') : '-',
        calibration_status,
        overdue_days,
        minutesDiff,
        time: mqtt?.time && lastUpdate ? lastUpdate.format('DD/MM/YYYY HH:mm:ss') : null
      };
    });

  // === ADDED: Fetch IKA Data & Append last_update ===
  const uuids = result.map((r: any) => r.uuid).filter((u: any) => u);

  if (uuids.length > 0) {
    try {
      // Fetch latest IKA per UUID
      const ikaRows = await db('hourly_sensor_data')
        .distinctOn('uuid')
        .select('uuid', 'ika_score', 'param_dominan')
        .whereIn('uuid', uuids)
        .orderBy('uuid') // required for distinctOn
        .orderBy('hour_timestamp', 'desc');

      const ikaMap = new Map();
      ikaRows.forEach((r: any) => ikaMap.set(r.uuid, r));

      result.forEach((item: any) => {
        const ika = ikaMap.get(item.uuid);
        item.ika_score = ika?.ika_score || 0;
        item.param_dominan = ika?.param_dominan || '-';
        item.last_update = item.time;
      });
    } catch (err) {
      console.error('Error fetching IKA data:', err);
      // Fallback if IKA fetch fails
      result.forEach((item: any) => {
        item.ika_score = 0;
        item.param_dominan = '-';
        item.last_update = item.time;
      });
    }
  } else {
      result.forEach((item: any) => {
        item.ika_score = 0;
        item.param_dominan = '-';
        item.last_update = item.time;
      });
  }



    const hidupCount = result.filter((x : {status : string}) => x.status === 'hidup').length;
    const matiCount = result.filter((x : {status : string}) => x.status === 'mati').length;

    res.json({
      success: true,
      total: result.length,
      Hidup: hidupCount,
      Mati: matiCount,
      data: result
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
        : role_id === 'adm' || role_id === 'eng' || allowedUuids.includes(item.uuid);

      const matchStasiun = id_stasiun ? item.id_stasiun === id_stasiun : true;
      return matchUuid && matchStasiun;
    });
  }


  // === IKA LOGS ===
  async handlerIkaLogs(req: Request, res: Response) {
    try {
      const {
        limit = 10,
        offset = 0,
        sort_by = 'hour_timestamp',
        sort_dir = 'desc',
        id_stasiun,
        id_mesin,
        start_date,
        end_date
      } = req.query;

      // 1. Build Base Builder (Joins + Filters ONLY)
      let baseBuilder = db('hourly_sensor_data as h')
        .leftJoin('devices as d', 'h.uuid', 'd.id_mesin');

      // Filters
      if (id_stasiun) {
        baseBuilder.where('h.nama_stasiun', id_stasiun as string);
      }

      if (id_mesin) {
        baseBuilder.where('h.uuid', id_mesin as string);
      }

      if (start_date) {
        baseBuilder.where('h.hour_timestamp', '>=', start_date as string);
      }

      if (end_date) {
        baseBuilder.where('h.hour_timestamp', '<=', end_date as string);
      }
      
      const role_id = req.body.role_id; 
      const user_id = req.body.user_id;

      if (role_id === 'usr') {
          baseBuilder.whereIn('h.uuid', function(qb: any) {
              qb.select('id_mesin')
                  .from('devices')
                  .where('dinas_id', user_id);
          });
      }

      // 2. Count Total (Clone base builder -> count)
      const countQuery = baseBuilder.clone().count('* as total').first();
      const totalResult = await countQuery;
      const total = parseInt(totalResult?.total || '0');

      // 3. Get Data (Clone base builder -> select -> sort -> paginate)
      const rawData = await baseBuilder.clone()
        .select(
          'h.*',
          'd.nama_stasiun',
          'd.id_mesin'
        )
        .orderBy(sort_by as string, sort_dir as string)
        .limit(Number(limit))
        .offset(Number(offset));

      // Process data to include IKA details
      const data = rawData.map((row: any) => {
          // Format to 2 decimals as requested
          const formatDec = (num: number) => (num || 0).toFixed(2);

          // Use stored indices if available, otherwise calculate on the fly (fallback for old data)
          let ikaDetail;
          
          if (row.ika_idx_amonia != null) {
              ikaDetail = {
                  amonia: formatDec(row.ika_idx_amonia),
                  bod: formatDec(row.ika_idx_bod),
                  cod: formatDec(row.ika_idx_cod),
                  do_avg: formatDec(row.ika_idx_do),
                  nitrat: formatDec(row.ika_idx_nitrat),
                  ph: formatDec(row.ika_idx_ph),
                  tds: formatDec(row.ika_idx_tds),
                  tss: formatDec(row.ika_idx_tss)
              };
          } else {
              // Backward compatibility: Calculate on the fly for old records
              const ikaInput = {
                  amonia: parseFloat(row.n_avg || 0),
                  bod: parseFloat(row.bod_avg || 0),
                  cod: parseFloat(row.cod_avg || 0),
                  do_: parseFloat(row.do_avg || 0),
                  nitrat: parseFloat(row.no3_3_avg || 0),
                  ph: parseFloat(row.ph_avg || 0),
                  tds: parseFloat(row.ct_avg || 0), 
                  tss: parseFloat(row.tss_avg || 0)
              };
              
              const ikaResult = calculateIKA(ikaInput);
              
              ikaDetail = {
                  amonia: formatDec(ikaResult.indexPerParam.Amonia),
                  bod: formatDec(ikaResult.indexPerParam.BOD),
                  cod: formatDec(ikaResult.indexPerParam.COD),
                  do_avg: formatDec(ikaResult.indexPerParam.DO),
                  nitrat: formatDec(ikaResult.indexPerParam.Nitrat),
                  ph: formatDec(ikaResult.indexPerParam.PH),
                  tds: formatDec(ikaResult.indexPerParam.TDS),
                  tss: formatDec(ikaResult.indexPerParam.TSS)
              };
          }

          return {
              ...row,
              ika_score: row.ika_score,
              ika_detail: ikaDetail,
              hour_timestamp: moment(row.hour_timestamp).format('DD/MM/YYYY HH:mm:ss'),
              created_at: moment(row.created_at).format('DD/MM/YYYY HH:mm:ss')
          };
      });

      // Build pagination meta
      const total_page = Math.ceil(total / Number(limit));
      const current_page = Math.floor(Number(offset) / Number(limit)) + 1;

      res.json({
        success: true,
        message: 'Data IKA retrieved successfully',
        data: data,
        meta: {
            page: current_page,
            total_page: total_page,
            total_data: total,
            limit: Number(limit),
            offset: Number(offset)
        }
      });

    } catch (error: any) {
      console.error('❌ Error in handlerIkaLogs:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
  }

  private sortByStasiun(data: any[]): any[] {
    return data.sort((a, b) => a.id_stasiun.localeCompare(b.id_stasiun));
  }
}

export const DataMonitoringCtl = new DataMonitoringController();
