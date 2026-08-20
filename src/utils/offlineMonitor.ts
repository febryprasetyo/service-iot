import { db, logger, nowWib, moment } from './util';
import NotificationService from './notificationService';
import CronJob from 'node-cron';

export async function checkOfflineStations() {
  try {
    const now = moment().tz('Asia/Jakarta');
    const thresholdMinutes = 15;

    // Fetch all active stations
    const stations = await db('stations').select('id_mesin', 'nama_stasiun');

    for (const station of stations) {
      const uuid = station.id_mesin;
      if (!uuid) continue;
      const stationName = station.nama_stasiun || uuid;

      // Get latest data from sensor_data or mqtt_monitoring
      let latestData = await db('sensor_data')
        .where({ uuid })
        .orderBy('time', 'desc')
        .first();

      if (!latestData) {
        latestData = await db('mqtt_monitoring').where({ uuid }).first();
      }

      if (latestData && latestData.time) {
        const lastUpdate = moment.tz(latestData.time, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta');
        const diffMinutes = now.diff(lastUpdate, 'minutes');

        // Fetch last notification for this station to check previous state
        const lastNotif = await db('notifications')
          .where({ uuid })
          .whereIn('type', ['offline', 'online', 'station_offline', 'station_online'])
          .orderBy('created_at', 'desc')
          .first();

        const isCurrentlyOffline = diffMinutes > thresholdMinutes;

        if (isCurrentlyOffline) {
          // If previous notification was NOT offline, create an offline alert
          const alreadyNotifiedOffline = lastNotif && (lastNotif.type === 'offline' || lastNotif.type === 'station_offline');

          if (!alreadyNotifiedOffline) {
            await NotificationService.createNotification({
              category: 'connectivity',
              type: 'station_offline',
              severity: 'critical',
              title: 'Stasiun Offline',
              uuid: uuid,
              message: `Stasiun ${stationName} terdeteksi OFFLINE (Terakhir kirim data: ${lastUpdate.format('HH:mm:ss')})`,
              entity_type: 'station',
              entity_id: uuid,
              action_url: `/monitoring/${uuid}`,
              metadata: {
                station_name: stationName,
                last_time: lastUpdate.format('YYYY-MM-DD HH:mm:ss'),
                diff_minutes: diffMinutes
              },
              created_by: 'SYSTEM'
            });
            logger.info(`[OFFLINE-MONITOR] Created offline notification for ${uuid} (${stationName})`);
          }
        } else {
          // Station is currently online. Check if it just recovered from offline state
          const wasPreviouslyOffline = lastNotif && (lastNotif.type === 'offline' || lastNotif.type === 'station_offline');

          if (wasPreviouslyOffline) {
            await NotificationService.createNotification({
              category: 'connectivity',
              type: 'station_online',
              severity: 'success',
              title: 'Stasiun Kembali Online',
              uuid: uuid,
              message: `Stasiun ${stationName} kembali aktif dan terhubung normal.`,
              entity_type: 'station',
              entity_id: uuid,
              action_url: `/monitoring/${uuid}`,
              metadata: {
                station_name: stationName,
                recovered_time: now.format('YYYY-MM-DD HH:mm:ss')
              },
              created_by: 'SYSTEM'
            });
            logger.info(`[OFFLINE-MONITOR] Created online recovery notification for ${uuid} (${stationName})`);
          }
        }
      }
    }
  } catch (error) {
    logger.error(`[OFFLINE-MONITOR] Error checking offline stations: ${error}`);
  }
}

// Run every 5 minutes for prompt offline and recovery detection
export const offlineMonitorScheduler = CronJob.schedule("*/5 * * * *", async () => {
  logger.info("[OFFLINE-MONITOR] Running station connectivity check...");
  await checkOfflineStations();
});
