import { Request, Response } from 'express';
import { db, moment } from '../utils/util';

import connection from '../config/redis';
import { getMonitoringDataWithStatus } from '../utils/statusHelper';

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

        const mainStatus = isAlive ? 'aktif' : 'mati';

        // Use Helper to get processed data
        // It returns { sensors, ika }
        const result = await getMonitoringDataWithStatus(uuid, row, isAlive);
        const { sensors, ika } = result || { sensors: {}, ika: {} };

        const data = {
            uuid: row.uuid,
            id_stasiun: row.id_stasiun,
            time: row.time,
            
            ...sensors, // Spread processed values and statuses

            pump_status: isAlive ? row.pump_status : '0',
            cv_status: isAlive ? row.cv_status : '0',
            read_status: isAlive ? row.read_status : '0'
        };

        return res.json({
            success: true,
            status: mainStatus,
            data,
            ika: ika // Separate field as requested
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
