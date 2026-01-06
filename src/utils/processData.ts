import { logger, db, errorCodes, moment, nowWib }
   from './util';
import { klhkSyncQueue } from './queue';
import axios from 'axios';
import CronJob from 'node-cron'
import 'dotenv/config';
const apiKey = process.env.API_KEY
const apiSecret = process.env.API_SECRET

class ProcessData {
  static isSyncing = false;

  /**
   * Function scheduler send data iot to API klhk
   * @returns 
   */
  async syncDataIot() {
    if (ProcessData.isSyncing) {
        logger.warn(`[SYNC-KLHK] Sync process is already running. Skipping this trigger.`);
        return;
    }

    ProcessData.isSyncing = true;

    try {
      logger.info(`[SYNC-KLHK] Starting sync process check (triggering queue)...`);

      let hasMoreData = true;
      let iterationCount = 0;
      const BATCH_SIZE = 1000; // Increased from 100 to 1000

      while (hasMoreData) {
        // 1. Unsynced data from hourly_sensor_data JOIN devices & users for API keys
        // Fetch unsynced data, deduplicate by (uuid, hour_timestamp), and use hour_timestamp for payload.
        const unsyncedDataQuery = db('hourly_sensor_data as h')
          .join('devices as d', 'd.id_mesin', 'h.uuid')
          .join('users as u', 'u.id', 'd.dinas_id')
          .where('h.synced_to_klhk', false)
          .where('h.hour_timestamp', '<', moment().startOf('hour').toDate());

        // DEBUG LOGGING
        try {
            const debugQuery = unsyncedDataQuery.clone().toString();
            logger.info(`[SYNC-KLHK] Executing query: ${debugQuery}`);
            logger.info(`[SYNC-KLHK] Time check: ${moment().format()} (Syncing data before: ${moment().startOf('hour').format()})`);
        } catch (e) {
            logger.error(`[SYNC-KLHK] Error logging query: ${e}`);
        }

        const unsyncedData = await unsyncedDataQuery
          .select(
            'h.id', // Keep original ID for marking as synced
            'h.uuid',
            'h.hour_timestamp',
            'h.nama_stasiun',
            'h.temperature_avg',
            'h.ct_avg',
            'h.do_avg',
            'h.ph_avg',
            'h.tur_avg',
            'h.depth_avg',
            'h.no3_3_avg',
            'h.n_avg',
            'h.cod_avg',
            'h.bod_avg',
            'h.tss_avg',
            'u.api_key',
            'u.secret_key',
            'd.id_mesin'
          )
          .orderBy('h.hour_timestamp', 'asc') // Order to ensure consistent deduplication if multiple records exist
          .limit(BATCH_SIZE);

        if (unsyncedData.length === 0) {
          logger.info(`[SYNC-KLHK] No more unsynced data found.`);
          hasMoreData = false;
          break;
        }

        // Group data by nama_stasiun and hour_timestamp to ensure each unique hourly record for a station is processed once
        const stationHourDataMap = new Map(); // Key: `${nama_stasiun}-${hour_timestamp}`, Value: first row for that station-hour
        const skippedIds: number[] = [];

        for (const row of unsyncedData) {
          if (!row.nama_stasiun) {
            logger.warn(`[SYNC-KLHK] Skipping record with ID ${row.id} due to missing nama_stasiun.`);
            skippedIds.push(row.id);
            continue;
          }
          const key = `${row.nama_stasiun}-${moment(row.hour_timestamp).toISOString()}`;
          if (!stationHourDataMap.has(key)) {
            stationHourDataMap.set(key, row);
          } else {
            // This is a duplicate for the same station-hour, mark it as skipped so we can update it as synced later
            skippedIds.push(row.id);
          }
        }
        
        // CRITICAL FIX: Also add the IDs of the "unique" records to a list so we can check if they are being re-processed
        // Actually, the issue might be that we are processing them but NOT marking them as synced fast enough?
        // No, the queue worker marks them as synced.
        // But if the loop runs fast, it might fetch the same data again before the worker finishes?
        // Wait, we are inside a while loop. We fetch, queue, then fetch again.
        // If the queue worker hasn't finished the first batch, the second fetch will find the SAME unsynced data!
        // FIX: We must mark the queued items as 'synced' (or a temporary status) IMMEDIATELY after queuing, 
        // OR we must wait for the queue to drain (not practical).
        // BETTER FIX: Mark them as synced_to_klhk = true (or a new 'pending' state if we had one) immediately here.
        // If the job fails, the worker can set it back to false.
        
        // Let's implement the "Optimistic Sync" approach: Mark as synced immediately. 
        // If the worker fails, it should ideally revert it, but for now let's just stop the duplicates.
        const queuedIds = Array.from(stationHourDataMap.values()).map((r: any) => r.id);
        const allIdsToMark = [...skippedIds, ...queuedIds];
        const uniqueStationHourData = Array.from(stationHourDataMap.values());

        logger.info(`[SYNC-KLHK] Fetched ${unsyncedData.length} records. Processing ${uniqueStationHourData.length} unique station-hour records. Skipping ${skippedIds.length} duplicates/invalid.`);

        // 2. Queue jobs for unique records
        for (const row of uniqueStationHourData) {
          // Guard against missing nama_stasiun, though it should be caught by the grouping logic above
          if (!row.nama_stasiun) {
             // Should not happen due to check above, but safe guard
             continue;
          }

          const timestampMoment = moment(row.hour_timestamp);
          logger.info(`[SYNC-KLHK] Processing Row ID: ${row.id} | Raw TS: ${row.hour_timestamp} | Parsed: ${timestampMoment.format()}`);
          
          // Add 1 hour to make JAM consistent with sync time
          // Example: Sync at 14:00 sends data from 13:00, but labeled as 14:00
          const payloadTimestamp = timestampMoment.clone().add(1, 'hour');
          
          // Construct the EXACT payload expected by KLHK
          const payload = {
            data: {
              IDStasiun: row.nama_stasiun,
              // Use payloadTimestamp (hour_timestamp + 1 hour) for Tanggal and Jam
              Tanggal: payloadTimestamp.format('YYYY-MM-DD'),
              Jam: payloadTimestamp.format('HH:mm:ss'),
              Suhu: row.temperature_avg?.toFixed(2),
              TDS: row.ct_avg?.toFixed(2),
              DO: row.do_avg?.toFixed(2),
              PH: row.ph_avg?.toFixed(2),
              Turbidity: row.tur_avg?.toFixed(2),
              Kedalaman: row.depth_avg?.toFixed(2),
              Nitrat: row.no3_3_avg?.toFixed(2),
              Amonia: row.n_avg?.toFixed(2),
              COD: row.cod_avg?.toFixed(2),
              BOD: row.bod_avg?.toFixed(2),
              TSS: row.tss_avg?.toFixed(2)
            },
            apikey: row.api_key,
            apisecret: row.secret_key
          };

          // Create unique jobId based on station and hour to prevent duplicate jobs
          const jobId = `${row.nama_stasiun}-${timestampMoment.format('YYYY-MM-DD-HH')}`;
          
          await klhkSyncQueue.add('klhk-sync-job', {
            rowId: row.id, // Pass the original row ID to mark as synced later
            data: payload
          }, {
            jobId: jobId, // BullMQ will reject duplicate jobs with same jobId
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true
          });
        }

        logger.info(`[SYNC-KLHK] Queued ${uniqueStationHourData.length} jobs.`);

        // 3. Mark ALL processed records (skipped + queued) as synced IMMEDIATELY 
        // This prevents the loop from fetching them again in the next iteration before the worker finishes.
        if (allIdsToMark.length > 0) {
            try {
                await db('hourly_sensor_data')
                    .whereIn('id', allIdsToMark)
                    .update({
                        synced_to_klhk: true,
                        sync_attempted_at: db.fn.now()
                    });
                logger.info(`[SYNC-KLHK] Marked ${allIdsToMark.length} records (queued + duplicates) as synced to prevent re-fetching.`);
            } catch (err) {
                logger.error(`[SYNC-KLHK] Failed to mark records as synced: ${err}`);
            }
        }
        
        // If we fetched fewer than BATCH_SIZE, we are done
        if (unsyncedData.length < BATCH_SIZE) {
            hasMoreData = false;
        }

        // Safety break
        iterationCount++;
        if (iterationCount > 10) {
            logger.warn(`[SYNC-KLHK] Max iterations (10) reached. Stopping loop to prevent infinite run.`);
            hasMoreData = false;
        }
      }

    } catch (error: any) {
      logger.error(`[SYNC-KLHK] Error in sync trigger: ${error}`);
    } finally {
      ProcessData.isSyncing = false;
    }
  }

  async initScheduledJobs() {
    const scheduledJobFunction = CronJob.schedule(process.env.SET_TIME_CRONJOB || "0 */1 * * *", async () => {
      let ctx = new ProcessData()
      await ctx.syncDataIot()
    });
  
    scheduledJobFunction.start();
  }
}

export = ProcessData