import NotificationService from './notificationService';
import { db } from './util';

describe('NotificationService & Multi-user Read Tracking', () => {
  let createdNotificationId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Ensure test user exists
    const existingUser = await db('users').where({ username: 'test_notif_user' }).first();
    if (existingUser) {
      testUserId = existingUser.id;
    } else {
      const [inserted] = await db('users')
        .insert({
          username: 'test_notif_user',
          password: 'hashedpassword',
          role_id: 'eng',
          fullname: 'Test Notif User'
        })
        .returning('id');
      testUserId = typeof inserted === 'object' ? inserted.id : inserted;
    }
  });

  afterAll(async () => {
    if (createdNotificationId) {
      await db('user_notification_reads').where({ notification_id: createdNotificationId }).del();
      await db('notifications').where({ id: createdNotificationId }).del();
    }
    if (testUserId) {
      await db('user_notification_reads').where({ user_id: testUserId }).del();
      await db('users').where({ id: testUserId }).del();
    }
    await db.destroy();
  });

  it('creates notification with rich taxonomy and metadata', async () => {
    const notif = await NotificationService.createNotification({
      category: 'connectivity',
      type: 'station_offline',
      severity: 'critical',
      title: 'Stasiun Offline',
      uuid: 'TEST_UUID_01',
      message: 'Stasiun Uji terdeteksi OFFLINE',
      action_url: '/monitoring/TEST_UUID_01',
      metadata: { station_name: 'Stasiun Uji' },
      target_role: 'all',
      created_by: 'TEST'
    });

    expect(notif).toBeDefined();
    expect(notif.id).toBeDefined();
    expect(notif.category).toBe('connectivity');
    expect(notif.severity).toBe('critical');
    expect(notif.title).toBe('Stasiun Offline');
    expect(notif.action_url).toBe('/monitoring/TEST_UUID_01');

    createdNotificationId = notif.id;
  });

  it('fetches notifications with initial unread state for test user', async () => {
    const notifs = await NotificationService.getNotifications({
      userId: testUserId,
      role: 'eng',
      limit: 10
    });

    const targetNotif = notifs.find(n => n.id === createdNotificationId);
    expect(targetNotif).toBeDefined();
    expect(targetNotif?.is_read).toBe(false);

    const unreadCount = await NotificationService.getUnreadCount(testUserId, 'eng');
    expect(unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('marks notification as read for test user without affecting other users', async () => {
    await NotificationService.markAsRead(createdNotificationId, testUserId);

    const notifsForUser = await NotificationService.getNotifications({
      userId: testUserId,
      role: 'eng'
    });
    const targetForUser = notifsForUser.find(n => n.id === createdNotificationId);
    expect(targetForUser?.is_read).toBe(true);

    // Another user (e.g. userId = 999999) should still see is_read as false
    const notifsForOther = await NotificationService.getNotifications({
      userId: 999999,
      role: 'eng'
    });
    const targetForOther = notifsForOther.find(n => n.id === createdNotificationId);
    expect(targetForOther?.is_read).toBe(false);
  });

  it('marks all notifications as read for test user', async () => {
    const result = await NotificationService.markAllAsRead(testUserId, 'eng');
    expect(result.success).toBe(true);

    const unreadCount = await NotificationService.getUnreadCount(testUserId, 'eng');
    expect(unreadCount).toBe(0);
  });
});
