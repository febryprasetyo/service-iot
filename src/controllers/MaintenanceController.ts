import { Request, Response } from 'express';
import { db, logger, nowWib } from '../utils/util';
import connection from '../config/redis';

class MaintenanceController {
  
  /**
   * Set Maintenance Status
   * POST /maintenance
   * Body: { uuid: string, status: 'maintenance' | 'calibration' | 'stop' | 'start' }
   */
  async handleSetMaintenance(req: Request, res: Response) {
    try {
      const { uuid, status, activity_type, description, next_calibration_date } = req.body;
      const created_by = (req as any).user?.username || 'admin'; 

      if (!uuid || !status) {
        return res.status(400).json({ 
          status: { code: 400, description: 'UUID and Status are required' } 
        });
      }

      const validStatuses = ['maintenance', 'calibration', 'stop', 'start'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          status: { code: 400, description: `Invalid status. Must be one of: ${validStatuses.join(', ')}` } 
        });
      }

      const redisKey = `maintenance:${uuid}`;

      // 1. Redis Action
      if (status === 'start') {
        await connection.del(redisKey);
        logger.info(`[MAINTENANCE] Resumed normal operation for ${uuid} (Redis key deleted)`);
      } else {
        await connection.set(redisKey, status);
        logger.info(`[MAINTENANCE] Set status '${status}' for ${uuid}`);
      }

      // 2. Database Action (Log history)
      await db('maintenance_logs').insert({
        uuid,
        status,
        activity_type,
        description,
        created_by,
        created_at: nowWib()
      });

      // 3. Update Station Status Table
      let instrument_status = 'NORMAL';
      if (status === 'maintenance') instrument_status = 'SEDANG DIPERBAIKI';
      else if (status === 'calibration') instrument_status = 'KALIBRASI';
      else if (status === 'stop') instrument_status = 'RUSAK';
      else instrument_status = 'NORMAL';

      const updateData: any = { instrument_status };
      if (next_calibration_date) {
        updateData.next_calibration_date = next_calibration_date;
      }

      await db('stations').where('id_mesin', uuid).update(updateData);

      return res.status(200).json({
        status: {
          code: 200,
          description: 'Maintenance status updated successfully'
        },
        data: {
          uuid,
          current_status: status,
          instrument_status
        }
      });

    } catch (error: any) {
      logger.error(`[MAINTENANCE] Error setting status: ${error.message}`);
      return res.status(500).json({
        status: { code: 500, description: 'Internal Server Error' },
        error: error.message
      });
    }
  }

  /**
   * Get Logbook History for a station
   * GET /maintenance/history/:uuid
   */
  async getLogbookHistory(req: Request, res: Response) {
    try {
      const { uuid } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      if (!uuid) {
        return res.status(400).json({ 
          status: { code: 400, description: 'UUID is required' } 
        });
      }

      const history = await db('maintenance_logs')
        .where('uuid', uuid)
        .orderBy('created_at', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      return res.status(200).json({
        success: true,
        data: history
      });

    } catch (error: any) {
      logger.error(`[MAINTENANCE] Error fetching history: ${error.message}`);
      return res.status(500).json({
        status: { code: 500, description: 'Internal Server Error' },
        error: error.message
      });
    }
  }

  /**
   * Update Calibration Schedule
   * POST /maintenance/calibration-schedule
   * Body: { uuid: string, next_calibration_date: string }
   */
  async handleUpdateCalibration(req: Request, res: Response) {
    try {
      const { uuid, next_calibration_date } = req.body;

      if (!uuid || !next_calibration_date) {
        return res.status(400).json({ 
          status: { code: 400, description: 'UUID and Next Calibration Date are required' } 
        });
      }

      await db('stations').where('id_mesin', uuid).update({ next_calibration_date });

      return res.status(200).json({
        success: true,
        message: 'Calibration schedule updated successfully'
      });

    } catch (error: any) {
      logger.error(`[MAINTENANCE] Error updating calibration: ${error.message}`);
      return res.status(500).json({
        status: { code: 500, description: 'Internal Server Error' },
        error: error.message
      });
    }
  }
}

export default MaintenanceController;
