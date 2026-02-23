import { Request, Response } from 'express';
import { db, logger, sendResponseCustom, sendResponseError, errorCodes, createError, validateParamsAll } from '../utils/util';
import NotificationService from '../utils/notificationService';

class NotificationController {
  /**
   * Get list of notifications
   */
  async handleList(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const data = await NotificationService.getNotifications(limit, offset);
      const unreadCount = await NotificationService.getUnreadCount();

      return sendResponseCustom(res, {
        success: true,
        data: {
          notifications: data,
          unread_count: unreadCount
        }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Mark notification as read
   */
  async handleRead(req: Request, res: Response) {
    try {
      const { id } = req.body;

      if (!id) {
        throw createError('Notification ID is required', 'E_BAD_REQUEST');
      }

      await NotificationService.markAsRead(id);

      return sendResponseCustom(res, {
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Mark all as read
   */
  async handleReadAll(req: Request, res: Response) {
    try {
      await db('notifications').where({ is_read: false }).update({ is_read: true });

      return sendResponseCustom(res, {
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }
}

export default new NotificationController();
