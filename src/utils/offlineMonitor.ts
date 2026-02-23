import { db, logger, nowWib, moment } from './util';
import NotificationService from './notificationService';
import CronJob from 'node-cron';

export async function checkOfflineStations() {
  try {
    const now = moment();
    const thresholdMinutes = 15;

    // Fetch all active stations
    const stations = await db('stations').select('id_mesin', 'nama_stasiun');

    for (const station of stations) {
      const uuid = station.id_mesin;
      const stationName = station.nama_stasiun || uuid;

      // Get latest data time from sensor_data or mqtt_monitoring
      const latestData = await db('sensor_data').where({ uuid }).first();

      if (latestData) {
        const lastUpdate = moment(latestData.time);
        const diffMinutes = now.diff(lastUpdate, 'minutes');

        if (diffMinutes > thresholdMinutes) {
          // Check if we already created a notification for THIS specific offline event
          // If a notification exists that was created AFTER the lastUpdate, it means we already reported it.
          const existingNotif = await db('notifications')
            .where({
              uuid: uuid,
              type: 'offline'
            })
            .where('created_at', '>', lastUpdate.toDate())
            .first();

          if (!existingNotif) {
            await NotificationService.createNotification({
              type: 'offline',
              uuid: uuid,
              message: `Stasiun ${stationName} terdeteksi OFFLINE (Terakhir update: ${lastUpdate.format('HH:mm:ss')})`,
              created_by: 'SYSTEM'
            });
            logger.info(`[OFFLINE-MONITOR] Created offline notification for ${uuid}`);
          }
        }
      }
    }
  } catch (error) {
    logger.error(`[OFFLINE-MONITOR] Error: ${error}`);
  }
}

// Run every 10 minutes
export const offlineMonitorScheduler = CronJob.schedule("*/10 * * * *", async () => {
  logger.info("[OFFLINE-MONITOR] Running check...");
  await checkOfflineStations();
});
