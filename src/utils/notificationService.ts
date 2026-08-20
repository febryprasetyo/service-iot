import { db, logger, nowWib } from './util';
import { broadcastNotification } from '../websocket/broadcaster';

export type NotificationCategory = 'connectivity' | 'quality' | 'calibration' | 'maintenance' | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';
export type NotificationType =
  | 'offline'
  | 'online'
  | 'station_offline'
  | 'station_online'
  | 'threshold_exceeded'
  | 'maintenance'
  | 'logbook'
  | 'calibration_submitted'
  | 'calibration_approved'
  | 'calibration_rejected'
  | 'calibration_due'
  | string;

export interface CreateNotificationInput {
  category?: NotificationCategory;
  type: NotificationType;
  severity?: NotificationSeverity;
  title?: string;
  uuid?: string | null;
  message: string;
  entity_type?: string | null;
  entity_id?: string | number | null;
  action_url?: string | null;
  metadata?: any;
  target_role?: string | null;
  created_by?: string | null;
}

export interface GetNotificationOptions {
  userId?: number;
  role?: string;
  limit?: number;
  offset?: number;
  category?: string;
  unreadOnly?: boolean;
}

function getDefaultTitle(type: string): string {
  switch (type) {
    case 'offline':
    case 'station_offline':
      return 'Stasiun Offline';
    case 'online':
    case 'station_online':
      return 'Stasiun Kembali Online';
    case 'threshold_exceeded':
      return 'Baku Mutu Terlampaui';
    case 'calibration_submitted':
      return 'Pengajuan Kalibrasi';
    case 'calibration_approved':
      return 'Kalibrasi Disetujui';
    case 'calibration_rejected':
      return 'Kalibrasi Ditolak';
    case 'calibration_due':
      return 'Jatuh Tempo Kalibrasi';
    case 'maintenance':
      return 'Pembaruan Pemeliharaan';
    case 'logbook':
      return 'Catatan Logbook Baru';
    default:
      return 'Pemberitahuan Sistem';
  }
}

function getDefaultCategory(type: string): NotificationCategory {
  switch (type) {
    case 'offline':
    case 'online':
    case 'station_offline':
    case 'station_online':
      return 'connectivity';
    case 'threshold_exceeded':
      return 'quality';
    case 'calibration_submitted':
    case 'calibration_approved':
    case 'calibration_rejected':
    case 'calibration_due':
      return 'calibration';
    case 'maintenance':
    case 'logbook':
      return 'maintenance';
    default:
      return 'system';
  }
}

function getDefaultSeverity(type: string): NotificationSeverity {
  switch (type) {
    case 'offline':
    case 'station_offline':
      return 'critical';
    case 'online':
    case 'station_online':
    case 'calibration_approved':
      return 'success';
    case 'threshold_exceeded':
    case 'calibration_rejected':
    case 'calibration_due':
      return 'warning';
    default:
      return 'info';
  }
}

class NotificationService {
  /**
   * Create a new notification, persist to DB, and broadcast via WebSocket
   */
  async createNotification(data: CreateNotificationInput) {
    const category = data.category || getDefaultCategory(data.type);
    const severity = data.severity || getDefaultSeverity(data.type);
    const title = data.title || getDefaultTitle(data.type);
    const targetRole = data.target_role || 'all';
    const actionUrl = data.action_url || (data.uuid ? `/monitoring/${data.uuid}` : null);

    console.log(`[NOTIFICATION-SERVICE] Creating notification: type=${data.type}, severity=${severity}, uuid=${data.uuid}`);
    try {
      const insertPayload: any = {
        category,
        type: data.type,
        severity,
        title,
        uuid: data.uuid || null,
        message: data.message,
        entity_type: data.entity_type || (data.uuid ? 'station' : null),
        entity_id: data.entity_id ? String(data.entity_id) : (data.uuid || null),
        action_url: actionUrl,
        metadata: data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : null,
        target_role: targetRole,
        created_by: data.created_by || 'SYSTEM',
        created_at: nowWib()
      };

      const [idResult] = await db('notifications')
        .insert(insertPayload)
        .returning('id');

      const id = typeof idResult === 'object' && idResult !== null ? idResult.id : idResult;
      const notification = await db('notifications').where({ id }).first();

      if (notification) {
        // Parse metadata if needed
        if (typeof notification.metadata === 'string') {
          try {
            notification.metadata = JSON.parse(notification.metadata);
          } catch {}
        }
        // Broadcast to all connected websocket clients
        broadcastNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error(`[NOTIFICATION-SERVICE] Error creating notification: ${error}`);
      throw error;
    }
  }

  /**
   * Get notifications with multi-user read state tracking and category filtering
   */
  async getNotifications(options: GetNotificationOptions = {}) {
    const { userId, role, limit = 20, offset = 0, category, unreadOnly = false } = options;

    if (userId) {
      // Multi-user read tracking via user_notification_reads table
      let query = db('notifications as n')
        .leftJoin('user_notification_reads as unr', function() {
          this.on('unr.notification_id', '=', 'n.id')
            .andOn('unr.user_id', '=', db.raw('?', [userId]));
        })
        .select(
          'n.id',
          'n.category',
          'n.type',
          'n.severity',
          'n.title',
          'n.uuid',
          'n.message',
          'n.entity_type',
          'n.entity_id',
          'n.action_url',
          'n.metadata',
          'n.target_role',
          'n.created_by',
          'n.created_at',
          db.raw('CASE WHEN unr.id IS NOT NULL THEN true ELSE false END as is_read'),
          'unr.read_at as user_read_at'
        );

      if (role && role !== 'adm') {
        query = query.where(function() {
          this.where('n.target_role', 'all')
            .orWhere('n.target_role', role)
            .orWhereNull('n.target_role');
        });
      }

      if (category && category !== 'all') {
        query = query.where('n.category', category);
      }

      if (unreadOnly) {
        query = query.whereNull('unr.id');
      }

      const rows = await query
        .orderBy('n.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return rows.map((r: any) => ({
        ...r,
        is_read: Boolean(r.is_read),
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
      }));
    }

    // Fallback if no userId provided
    let query = db('notifications').select('*');

    if (category && category !== 'all') {
      query = query.where('category', category);
    }
    if (unreadOnly) {
      query = query.where('is_read', false);
    }

    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return rows.map((r: any) => ({
      ...r,
      is_read: Boolean(r.is_read),
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
    }));
  }

  /**
   * Get total unread count for a user
   */
  async getUnreadCount(userId?: number, role?: string) {
    if (userId) {
      let query = db('notifications as n')
        .leftJoin('user_notification_reads as unr', function() {
          this.on('unr.notification_id', '=', 'n.id')
            .andOn('unr.user_id', '=', db.raw('?', [userId]));
        })
        .whereNull('unr.id');

      if (role && role !== 'adm') {
        query = query.where(function() {
          this.where('n.target_role', 'all')
            .orWhere('n.target_role', role)
            .orWhereNull('n.target_role');
        });
      }

      const result = await query.count('* as count').first();
      return parseInt(result?.count?.toString() || '0');
    }

    const result = await db('notifications').where({ is_read: false }).count('* as count').first();
    return parseInt(result?.count?.toString() || '0');
  }

  /**
   * Mark a specific notification as read for a user
   */
  async markAsRead(id: number, userId?: number) {
    if (userId) {
      await db('user_notification_reads')
        .insert({
          user_id: userId,
          notification_id: id,
          read_at: db.fn.now()
        })
        .onConflict(['user_id', 'notification_id'])
        .ignore();

      return { id, is_read: true };
    }

    await db('notifications').where({ id }).update({ is_read: true });
    return { id, is_read: true };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId?: number, role?: string) {
    if (userId) {
      let unreadQuery = db('notifications as n')
        .leftJoin('user_notification_reads as unr', function() {
          this.on('unr.notification_id', '=', 'n.id')
            .andOn('unr.user_id', '=', db.raw('?', [userId]));
        })
        .whereNull('unr.id')
        .select('n.id');

      if (role && role !== 'adm') {
        unreadQuery = unreadQuery.where(function() {
          this.where('n.target_role', 'all')
            .orWhere('n.target_role', role)
            .orWhereNull('n.target_role');
        });
      }

      const unreadRecords = await unreadQuery;
      if (unreadRecords.length > 0) {
        const insertRows = unreadRecords.map((r: any) => ({
          user_id: userId,
          notification_id: r.id,
          read_at: db.fn.now()
        }));

        // Batch insert in chunks
        await db('user_notification_reads')
          .insert(insertRows)
          .onConflict(['user_id', 'notification_id'])
          .ignore();
      }

      return { success: true, count: unreadRecords.length };
    }

    await db('notifications').where({ is_read: false }).update({ is_read: true });
    return { success: true };
  }
}

export default new NotificationService();
