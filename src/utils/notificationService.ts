import { db, logger, nowWib } from './util';
import { broadcastNotification } from '../websocket/broadcaster';

export type NotificationType = 'offline' | 'maintenance' | 'logbook';

class NotificationService {
  /**
   * Create a new notification and broadcast it
   */
  async createNotification(data: {
    type: NotificationType;
    uuid: string;
    message: string;
    created_by?: string;
  }) {
    console.log(`[NOTIFICATION-SERVICE] Creating notification: type=${data.type}, uuid=${data.uuid}`);
    try {
      const [idResult] = await db('notifications')
        .insert({
          type: data.type,
          uuid: data.uuid,
          message: data.message,
          created_by: data.created_by,
          created_at: nowWib()
        })
        .returning('id');

      const id = idResult.id || idResult;
      const notification = await db('notifications').where({ id }).first();

      // Broadcast to all connected websocket clients
      broadcastNotification(notification);

      return notification;
    } catch (error) {
      logger.error(`[NOTIFICATION-SERVICE] Error creating notification: ${error}`);
      throw error;
    }
  }

  /**
   * Get unread notifications for a station or all
   */
  async getNotifications(limit = 20, offset = 0) {
    return db('notifications')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number) {
    return db('notifications').where({ id }).update({ is_read: true });
  }

  /**
   * Get total unread count
   */
  async getUnreadCount() {
    const result = await db('notifications').where({ is_read: false }).count('* as count').first();
    return parseInt(result?.count?.toString() || '0');
  }
}

export default new NotificationService();
