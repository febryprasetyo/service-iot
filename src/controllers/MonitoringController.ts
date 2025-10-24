import { Request, Response } from 'express';
import { db, moment } from '../utils/util';

class MonitoringController   {
    async getMonitoringByUuid(req: Request, res: Response) {
    try {
        const { uuid } = req.params;
        const now = moment();

        const row = await db('mqtt_monitoring').where({ uuid }).first();

        if (!row) {
        return res.status(404).json({
            success: false,
            message: `Data monitoring untuk UUID ${uuid} tidak ditemukan`
        });
        }

        const lastUpdate = moment(row.time);
        const hoursDiff = now.diff(lastUpdate, 'hours');
        const isAlive = hoursDiff <= 3;

        const status = isAlive ? 'aktif' : 'mati';

        const data = {
        uuid: row.uuid,
        id_stasiun: row.id_stasiun,
        time: row.time,
        temperature: isAlive ? row.temperature : '0',
        do_: isAlive ? row.do_ : '0',
        tur: isAlive ? row.tur : '0',
        ph: isAlive ? row.ph : '0',
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

        return res.json({
        success: true,
        status,
        data
        });
    } catch (err) {
        return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data monitoring',
        error: err
        });
    }
    }
}

export =  MonitoringController;
