import { Queue, Worker, Job } from 'bullmq';
import connection from '../config/redis';
import { db, logger, moment, nowWib } from './util';
import axios from 'axios';

// 1. Definisikan Queue
export const klhkSyncQueue = new Queue('klhk-sync', { connection });

// 2. Definisikan Worker untuk memproses job
const worker = new Worker('klhk-sync', async (job: Job) => {
    const { rowId, data } = job.data;
    
    // Circuit Breaker Check
    const cbKey = 'circuit:klhk:failure_count';
    const failureCount = await connection.get(cbKey);
    if (failureCount && parseInt(failureCount) > 20) {
        // Too many failures, pause aggressively to prevent log flood
        throw new Error("Circuit breaker open: Too many recent failures. Skipping job.");
    }
    
    logger.info(`[WORKER] Processing sync for row ID: ${rowId}`);

    try {
        // Kirim ke KLHK
        const url_klhk = process.env.URL_KLHK || process.env.KLHK_API_URL;
        if (!url_klhk) throw new Error("URL_KLHK/KLHK_API_URL not set in .env");

        const response = await axios.post(url_klhk, data, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 
        });
        
        // Reset failure count on success
        await connection.del(cbKey);

        const responseData = response.data;
        // KLHK usually returns status inside the data object too, checking structure...
        // Typical KLHK response: { status: { statusCode: 200, statusDesc: '...' }, rows: { data_uid: '...' } }
        // We generally treat HTTP 200 as success, but check body for logic errors if needed.
        
        const statusCode = responseData.status?.statusCode || response.status;
        const statusDesc = responseData.status?.statusDesc || response.statusText;
        const dataUid = responseData.rows?.data_uid || '-';

        if (response.status === 200 || response.status === 201) {
            // Success: Update database
            await db('hourly_sensor_data')
                .where('id', rowId)
                .update({ 
                    synced_to_klhk: true,
                    sync_attempted_at: nowWib() 
                });
                
             // Log success result to res_klhk (MATCHING LEGACY SCHEMA)
             await db('res_klhk').insert({
                 payload: JSON.stringify(data),
                 data_uid: dataUid,
                 status_code: statusCode,
                 status_desc: statusDesc,
                 id_stasiun: data.data.IDStasiun,
                 created_at: nowWib()
             });

             logger.info(`[WORKER] Sync success for row ID: ${rowId} (Station: ${data.data.IDStasiun})`);
        } else {
            throw new Error(`KLHK API returned status ${response.status}`);
        }
    } catch (error: any) {
        const errorRes = error.response?.data || error.message;
        const status = error.response?.status || 500;
        
        logger.error(`[WORKER] Sync failed for row ID: ${rowId}: ${error.message}`);
        
        // INCREMENT FAILURE COUNT
        // If it's a connection refused error, we increment the circuit breaker
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
             const cbKey = 'circuit:klhk:failure_count';
             await connection.incr(cbKey);
             await connection.expire(cbKey, 600); // Reset count after 10 minutes if no activity
        }

        // Log failure to res_klhk
        await db('res_klhk').insert({
             payload: JSON.stringify(data),
             data_uid: '-',
             status_code: status,
             status_desc: JSON.stringify(errorRes),
             id_stasiun: data.data?.IDStasiun || 'UNKNOWN',
             created_at: nowWib()
        });

        // Don't retry immediately if it's a catastrophic network failure to avoid log flooding
        if (error.code === 'ECONNREFUSED') {
             await job.moveToDelayed(Date.now() + 60000, job.token); // Retry in 1 minute
             return; 
        }

        throw error; // Let BullMQ handle retry for other errors
    }
}, { 
    connection,
    concurrency: 5, // Process 5 requests in parallel
    limiter: {
        max: 10, // Max 10 requests
        duration: 1000 // Per 1 second (Rate limiting to avoid ban)
    }
});

worker.on('failed', (job: Job | undefined, err: Error) => {
    if (job) {
      logger.error(`[WORKER] Job ${job.id} failed with ${err.message}`);
    }
});

export default klhkSyncQueue;
