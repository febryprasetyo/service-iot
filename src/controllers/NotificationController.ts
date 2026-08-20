import { Request, Response } from 'express';
import { db, logger, sendResponseCustom, sendResponseError, createError } from '../utils/util';
import NotificationService from '../utils/notificationService';

class NotificationController {
  /**
   * Get list of notifications with multi-user read state and category filter
   */
  async handleList(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = (req.query.category as string) || undefined;
      const unreadOnly = req.query.unread_only === 'true' || req.query.unread === 'true';

      const userId = req.user?.user_id || req.user?.id || req.body?.user_id;
      const role = req.user?.role_id || req.user?.role || req.body?.role_id;

      const data = await NotificationService.getNotifications({
        userId,
        role,
        limit,
        offset,
        category,
        unreadOnly
      });

      const unreadCount = await NotificationService.getUnreadCount(userId, role);

      return sendResponseCustom(res, {
        success: true,
        data: {
          notifications: data,
          unread_count: unreadCount,
          limit,
          offset
        }
      });
    } catch (error: any) {
      logger.error(`[NOTIFICATION-CONTROLLER] Error listing notifications: ${error.message}`);
      return sendResponseError(res, error);
    }
  }

  /**
   * Mark a notification as read
   */
  async handleRead(req: Request, res: Response) {
    try {
      const id = parseInt(req.body.id || req.params.id);
      const userId = req.user?.user_id || req.user?.id || req.body?.user_id;

      if (!id || isNaN(id)) {
        throw createError('Notification ID is required and must be a number', 'E_BAD_REQUEST');
      }

      const result = await NotificationService.markAsRead(id, userId);

      return sendResponseCustom(res, {
        success: true,
        message: 'Notification marked as read',
        data: result
      });
    } catch (error: any) {
      logger.error(`[NOTIFICATION-CONTROLLER] Error marking notification read: ${error.message}`);
      return sendResponseError(res, error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async handleReadAll(req: Request, res: Response) {
    try {
      const userId = req.user?.user_id || req.user?.id || req.body?.user_id;
      const role = req.user?.role_id || req.user?.role || req.body?.role_id;

      const result = await NotificationService.markAllAsRead(userId, role);

      return sendResponseCustom(res, {
        success: true,
        message: 'All notifications marked as read',
        data: result
      });
    } catch (error: any) {
      logger.error(`[NOTIFICATION-CONTROLLER] Error marking all notifications read: ${error.message}`);
      return sendResponseError(res, error);
    }
  }
}

export default new NotificationController();
