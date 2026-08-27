import { Request, Response } from 'express';
import { db, logger, sendResponseCustom, sendResponseError, createError, nowWib } from '../utils/util';

class ReportController {

  /**
   * List Reports
   * GET /reports
   * Query: station_uuid, status, limit, offset
   */
  async list(req: Request, res: Response) {
    try {
      const { station_uuid, status, limit = 20, offset = 0 } = req.query;

      const query = db('reports').select('*');

      if (station_uuid) {
        query.where('station_uuid', station_uuid);
      }

      if (status) {
        query.where('status', status);
      }

      const reports = await query
        .orderBy('created_at', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      const [{ count }] = await db('reports')
        .modify((qb) => {
          if (station_uuid) qb.where('station_uuid', station_uuid);
          if (status) qb.where('status', status);
        })
        .count('id as count');

      return sendResponseCustom(res, {
        success: true,
        data: reports,
        total: parseInt(count as string)
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Get Report Detail with History
   * GET /reports/:id
   */
  async detail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const report = await db('reports').where({ id }).first();
      if (!report) {
        throw createError('Report not found', 'E_NOT_FOUND');
      }

      // Fetch linked logs
      const history = await db('maintenance_logs')
        .where('report_id', id)
        .orderBy('created_at', 'desc');

      return sendResponseCustom(res, {
        success: true,
        data: {
          ...report,
          history
        }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Create Report
   * POST /reports
   */
  async create(req: Request, res: Response) {
    try {
      const { title, station_uuid, description, category } = req.body;
      const user = (req as any).user;

      if (!title || !station_uuid || !category) {
        throw createError('Title, Station UUID, and Category are required', 'E_BAD_REQUEST');
      }

      const [idResult] = await db('reports').insert({
        title,
        station_uuid,
        description,
        pic_id: user.user_id,
        pic_name: user.username, // Auto-filled from login
        category,
        status: 'Open',
        created_at: nowWib(),
        updated_at: nowWib()
      }).returning('id');

      const id = idResult.id || idResult;
      const report = await db('reports').where({ id }).first();

      return sendResponseCustom(res, {
        success: true,
        message: 'Report created successfully',
        data: report
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Update Report
   * PUT /reports/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, category, pic_id, pic_name, status } = req.body;
      const user = (req as any).user;

      const report = await db('reports').where({ id }).first();
      if (!report) {
        throw createError('Report not found', 'E_NOT_FOUND');
      }

      const updateData: any = {
        updated_at: nowWib()
      };

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (category) updateData.category = category;

      if (status !== undefined) {
        const allowedStatuses = ['Open', 'Eskalasi', 'Selesai'];
        if (!allowedStatuses.includes(status)) {
          throw createError('Status must be one of: Open, Eskalasi, Selesai', 'E_BAD_REQUEST');
        }
        updateData.status = status;
      }

      // PIC Protection: Only Admin can change PIC
      if (pic_id || pic_name) {
        const isUserAdmin = user?.role_id === 'adm' || user?.role_name?.toLowerCase() === 'admin';
        if (!isUserAdmin) {
          throw createError('Only Admin can change PIC', 'E_FORBIDDEN');
        }
        if (pic_id) updateData.pic_id = pic_id;
        if (pic_name) updateData.pic_name = pic_name;
      }

      await db('reports').where({ id }).update(updateData);

      const updatedReport = await db('reports').where({ id }).first();

      return sendResponseCustom(res, {
        success: true,
        message: 'Report updated successfully',
        data: updatedReport
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Follow-up Report (Tindak Lanjut Perbaikan)
   * POST /reports/:id/follow-up
   */
  async followUp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, progress, activity_type, description, photo_url } = req.body;

      const report = await db('reports').where({ id }).first();
      if (!report) {
        throw createError('Report not found', 'E_NOT_FOUND');
      }

      if (!description || typeof description !== 'string' || !description.trim()) {
        throw createError('Description is required for follow-up', 'E_BAD_REQUEST');
      }

      const allowedStatuses = ['Open', 'Eskalasi', 'Selesai'];
      let targetStatus: string;

      if (status) {
        if (!allowedStatuses.includes(status)) {
          throw createError('Status must be one of: Open, Eskalasi, Selesai', 'E_BAD_REQUEST');
        }
        targetStatus = status;
      } else if (progress) {
        if (progress === 'Selesai') {
          targetStatus = 'Selesai';
        } else if (progress === 'Pengerjaan') {
          targetStatus = 'Eskalasi';
        } else {
          targetStatus = 'Eskalasi';
        }
      } else {
        targetStatus = 'Eskalasi';
      }

      const finalProgress = progress || (targetStatus === 'Selesai' ? 'Selesai' : 'Pengerjaan');
      const logStatus = targetStatus === 'Selesai' ? 'start' : 'maintenance';

      await db('maintenance_logs').insert({
        uuid: report.station_uuid,
        status: logStatus,
        activity_type: activity_type || 'Tindak Lanjut Perbaikan',
        description: description.trim(),
        progress: finalProgress,
        report_id: report.id,
        photo_url: photo_url || null,
        created_by: (req as any).user?.username || 'Petugas',
        created_at: nowWib()
      });

      await db('reports').where({ id }).update({
        status: targetStatus,
        updated_at: nowWib()
      });

      if (targetStatus === 'Selesai') {
        await db('stations').where('id_mesin', report.station_uuid).update({ instrument_status: 'NORMAL' });
        try {
          const connection = require('../config/redis').default;
          if (connection && typeof connection.del === 'function') {
            await connection.del('maintenance:' + report.station_uuid);
          }
        } catch (e: any) {
          logger.error(`[ReportController] Redis del error: ${e?.message || e}`);
        }
      }

      try {
        const NotificationService = require('../utils/notificationService').default;
        if (NotificationService && typeof NotificationService.createNotification === 'function') {
          await NotificationService.createNotification({
            category: 'maintenance',
            type: 'logbook',
            severity: 'info',
            title: 'Tindak Lanjut Laporan: ' + report.title,
            uuid: report.station_uuid,
            message: 'Laporan ' + report.title + ' (' + report.station_uuid + ') ditindaklanjuti [' + targetStatus + ']: ' + description.trim(),
            entity_type: 'report',
            entity_id: String(report.id),
            action_url: '/reports',
            created_by: (req as any).user?.username || 'Petugas'
          });
        }
      } catch (e: any) {
        logger.error(`[ReportController] Notification error: ${e?.message || e}`);
      }

      const updatedReport = await db('reports').where({ id }).first();
      const history = await db('maintenance_logs')
        .where('report_id', id)
        .orderBy('created_at', 'desc');

      return sendResponseCustom(res, {
        success: true,
        message: 'Tindak lanjut laporan berhasil disimpan',
        data: {
          ...updatedReport,
          history
        }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Delete Report
   * DELETE /reports/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const report = await db('reports').where({ id }).first();
      if (!report) {
        throw createError('Report not found', 'E_NOT_FOUND');
      }

      await db('maintenance_logs').where('report_id', id).update({ report_id: null });
      await db('reports').where({ id }).delete();

      return sendResponseCustom(res, {
        success: true,
        message: 'Laporan berhasil dihapus'
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }
}

export default new ReportController();
