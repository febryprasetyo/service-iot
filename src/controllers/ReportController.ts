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
      const { title, description, category, pic_id, pic_name } = req.body;
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

      // PIC Protection: Only Admin can change PIC
      if (pic_id || pic_name) {
        if (user.role_name?.toLowerCase() !== 'admin') {
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
}

export default new ReportController();
