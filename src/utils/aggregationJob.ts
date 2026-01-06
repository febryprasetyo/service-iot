import { db, moment, logger } from './util';
import { calculateIKA } from './ikaCalculator';
import connection from '../config/redis';
import CronJob from 'node-cron';

export async function runAggregation(targetHour?: moment.Moment) {
  // If no target hour, aggregate the CURRENT hour (00 - 50) because we run at :50
  // e.g. if now is 12:50, we aggregate 12:00 - 12:50
  const hourToProcess = targetHour ? targetHour.clone().startOf('hour') : moment().startOf('hour');
  const start = hourToProcess.clone();
  // Cutoff at minute 50
  const end = hourToProcess.clone().add(50, 'minutes');

  logger.info(`[AGGREGATION] Starting for ${start.format('YYYY-MM-DD HH:mm:ss')} - ${end.format('YYYY-MM-DD HH:mm:ss')}`);

  try {
    // 1. Fetch raw data per UUID
    // Use created_at (server time in WIB) instead of time (device time)
    // This ensures data from different timezones (WIB/WITA/WIT) are aggregated correctly
    const rawData = await db('mqtt_datas')
      .whereBetween('created_at', [start.toDate(), end.toDate()])
      // .where('aggregated', false) // Optional: if we want to ensure exactly-once processing via flag
      .select('uuid', 'id_stasiun')
      .select(db.raw('AVG(CAST(temperature AS FLOAT)) as temp_avg'))
      .select(db.raw('AVG(CAST(do_ AS FLOAT)) as do_avg'))
      .select(db.raw('AVG(CAST(ph AS FLOAT)) as ph_avg'))
      .select(db.raw('AVG(CAST(tur AS FLOAT)) as tur_avg'))
      .select(db.raw('AVG(CAST(ct AS FLOAT)) as ct_avg')) // TDS/CT
      .select(db.raw('AVG(CAST(cod AS FLOAT)) as cod_avg'))
      .select(db.raw('AVG(CAST(bod AS FLOAT)) as bod_avg'))
      .select(db.raw('AVG(CAST(tss AS FLOAT)) as tss_avg'))
      .select(db.raw('AVG(CAST(n AS FLOAT)) as n_avg')) // Amonia
      .select(db.raw('AVG(CAST(no2 AS FLOAT)) as no2_avg'))
      .select(db.raw('AVG(CAST(no3_3 AS FLOAT)) as no3_3_avg')) // Nitrat
      .select(db.raw('AVG(CAST(depth AS FLOAT)) as depth_avg'))
      .select(db.raw('AVG(CAST(orp AS FLOAT)) as orp_avg'))
      .count('* as count')
      .groupBy('uuid', 'id_stasiun');

    if (rawData.length === 0) {
        logger.info(`[AGGREGATION] No data found for this hour.`);
        return;
    }

    // 2. Process each station
    // 2. Process each station
    for (const stationData of rawData) {
        
        // --- Maintenance Check ---
        const redisKey = `maintenance:${stationData.uuid}`;
        const maintenanceStatus = await connection.get(redisKey);
        
        let isMaintenance = false;
        let maintenanceCode = 0;
        let maintenanceCategory = ""; // MAINTENANCE, CALIBRATION, STOPPED
        
        if (maintenanceStatus) {
            isMaintenance = true;
            if (maintenanceStatus === 'maintenance') { 
                maintenanceCode = -1; 
                maintenanceCategory = "MAINTENANCE"; 
            } else if (maintenanceStatus === 'calibration') { 
                maintenanceCode = -2; 
                maintenanceCategory = "CALIBRATION"; 
            } else if (maintenanceStatus === 'stop') { 
                maintenanceCode = 0; 
                maintenanceCategory = "STOPPED"; 
            } else {
                isMaintenance = false; 
            }
        }

        // Helper to parse
        const p = (val: any) => parseFloat(val || 0);

        // Initial Values
        let v_temp = p(stationData.temp_avg);
        let v_do   = p(stationData.do_avg);
        let v_ph   = p(stationData.ph_avg);
        let v_tur  = p(stationData.tur_avg);
        let v_ct   = p(stationData.ct_avg);
        let v_cod  = p(stationData.cod_avg); // COD is reference
        let v_bod  = p(stationData.bod_avg);
        let v_tss  = p(stationData.tss_avg);
        let v_n    = p(stationData.n_avg);
        let v_no2  = p(stationData.no2_avg);
        let v_no3  = p(stationData.no3_3_avg);
        let v_depth= p(stationData.depth_avg);
        let v_orp  = p(stationData.orp_avg);

        // Status Variables
        let s_temp = 'NORMAL', s_do = 'NORMAL', s_ph = 'NORMAL', s_tur = 'NORMAL';
        let s_ct = 'NORMAL', s_cod = 'NORMAL', s_bod = 'NORMAL', s_tss = 'NORMAL';
        let s_n = 'NORMAL', s_no2 = 'NORMAL', s_no3 = 'NORMAL', s_depth = 'NORMAL', s_orp = 'NORMAL';

        if (isMaintenance) {
            // Apply Maintenance Code & Status
            const applyMaint = () => maintenanceCode;
            const applyStatus = () => maintenanceCategory;

            v_temp = applyMaint(); s_temp = applyStatus();
            v_do   = applyMaint(); s_do   = applyStatus();
            v_ph   = applyMaint(); s_ph   = applyStatus();
            v_tur  = applyMaint(); s_tur  = applyStatus();
            v_ct   = applyMaint(); s_ct   = applyStatus();
            v_cod  = applyMaint(); s_cod  = applyStatus();
            v_bod  = applyMaint(); s_bod  = applyStatus();
            v_tss  = applyMaint(); s_tss  = applyStatus();
            v_n    = applyMaint(); s_n    = applyStatus();
            v_no2  = applyMaint(); s_no2  = applyStatus();
            v_no3  = applyMaint(); s_no3  = applyStatus();
            v_depth= applyMaint(); s_depth= applyStatus();
            v_orp  = applyMaint(); s_orp  = applyStatus();

        } else {
            // --- Normal Operation : Broken Sensor Check ---
            const BROKEN_VAL = -3;
            const STATUS_OFFLINE = 'OFFLINE';

            // 1. Check COD first (Reference for BOD/TSS)
            // If COD itself is 0 -> It is Broken (Offline)
            const originalCodPositive = v_cod > 0;
            if (v_cod === 0) {
                v_cod = BROKEN_VAL;
                s_cod = STATUS_OFFLINE;
            }

            // 2. BOD & TSS Logic (Exception Rule)
            // Rule: If 0, only Broken if COD <= 0. If COD > 0, keep 0 (Normal).
            if (v_bod === 0) {
                if (originalCodPositive) {
                    // Valid 0
                    s_bod = 'NORMAL';
                } else {
                    v_bod = BROKEN_VAL;
                    s_bod = STATUS_OFFLINE;
                }
            }
            if (v_tss === 0) {
                if (originalCodPositive) {
                    s_tss = 'NORMAL';
                } else {
                    v_tss = BROKEN_VAL;
                    s_tss = STATUS_OFFLINE;
                }
            }

            // 3. General Sensors Logic
            // If 0 -> Broken (Offline)
            const checkBroken = (val: number, status: string): [number, string] => {
                if (val === 0) return [BROKEN_VAL, STATUS_OFFLINE];
                return [val, status];
            };

            [v_temp, s_temp] = checkBroken(v_temp, s_temp);
            [v_do, s_do]     = checkBroken(v_do, s_do);
            [v_ph, s_ph]     = checkBroken(v_ph, s_ph);
            [v_tur, s_tur]   = checkBroken(v_tur, s_tur);
            [v_ct, s_ct]     = checkBroken(v_ct, s_ct);
            // v_cod handled above
            // v_bod handled above
            // v_tss handled above
            [v_n, s_n]       = checkBroken(v_n, s_n);
            [v_no2, s_no2]   = checkBroken(v_no2, s_no2);
            [v_no3, s_no3]   = checkBroken(v_no3, s_no3);
            [v_depth, s_depth] = checkBroken(v_depth, s_depth);
            [v_orp, s_orp]   = checkBroken(v_orp, s_orp);
        }

        // Calculate IKA
        // We sanitize inputs for IKA calculation.
        // If val is -3 (OFFLINE), we must use "Ideal Values" so it doesn't skew the index high (False Alarm).
        const s = (val: number, type: 'polutan' | 'do' | 'ph') => {
            if (val === -3) { // OFFLINE / BROKEN
                if (type === 'do') return 4.0; // Minimal Safe DO
                if (type === 'ph') return 7.0; // Neutral pH
                return 0; // Clean
            }
            return Math.max(0, val); // Normal sanitation
        };
        
        let ikaResult;
        
        if (isMaintenance) {
             ikaResult = {
                 indeksPencemaran: 0, 
                 statusMutu: maintenanceCategory,
                 paramDominan: "-",
                 nilaiIndexDominan: 0,
                 indexPerParam: { 
                     Amonia: 0, BOD: 0, COD: 0, DO: 0, Nitrat: 0, PH: 0, TDS: 0, TSS: 0 
                 }
             };
        } else {
            const ikaInput = {
                amonia: s(v_n, 'polutan'),
                bod:    s(v_bod, 'polutan'),
                cod:    s(v_cod, 'polutan'),
                do_:    s(v_do, 'do'),
                nitrat: s(v_no3, 'polutan'),
                ph:     s(v_ph, 'ph'),
                tds:    s(v_ct, 'polutan'), 
                tss:    s(v_tss, 'polutan')
            };
            ikaResult = calculateIKA(ikaInput);
        }

        // 3. Insert into hourly_sensor_data
        await db('hourly_sensor_data')
            .insert({
                uuid: stationData.uuid,
                nama_stasiun: stationData.id_stasiun,
                hour_timestamp: start.toDate(),
                
                temperature_avg: v_temp,
                do_avg: v_do,
                ph_avg: v_ph,
                tur_avg: v_tur,
                ct_avg: v_ct,
                cod_avg: v_cod,
                bod_avg: v_bod,
                tss_avg: v_tss,
                n_avg: v_n,
                no2_avg: v_no2,
                no3_3_avg: v_no3,
                depth_avg: v_depth,
                orp_avg: v_orp,
                
                sample_count: stationData.count,
                
                ika_score: ikaResult.indeksPencemaran,
                ika_category: ikaResult.statusMutu,
                param_dominan: ikaResult.paramDominan,
                nilai_index_dominan: ikaResult.nilaiIndexDominan,

                // Detailed Indices
                ika_idx_amonia: ikaResult.indexPerParam.Amonia,
                ika_idx_bod: ikaResult.indexPerParam.BOD,
                ika_idx_cod: ikaResult.indexPerParam.COD,
                ika_idx_do: ikaResult.indexPerParam.DO,
                ika_idx_nitrat: ikaResult.indexPerParam.Nitrat,
                ika_idx_ph: ikaResult.indexPerParam.pH,
                ika_idx_tds: ikaResult.indexPerParam.TDS,
                ika_idx_tss: ikaResult.indexPerParam.TSS
            })
            .onConflict(['uuid', 'hour_timestamp'])
            .merge();
        
        // 4. Insert into hourly_sensor_status
        await db('hourly_sensor_status')
            .insert({
                uuid: stationData.uuid,
                hour_timestamp: start.toDate(),
                status_temp: s_temp,
                status_do: s_do,
                status_ph: s_ph,
                status_tur: s_tur,
                status_ct: s_ct,
                status_cod: s_cod,
                status_bod: s_bod,
                status_tss: s_tss,
                status_n: s_n,
                status_no2: s_no2,
                status_no3: s_no3,
                status_depth: s_depth,
                status_orp: s_orp
            })
            .onConflict(['uuid', 'hour_timestamp'])
            .merge();
    }

    // 4. Mark source rows as aggregated
    await db('mqtt_datas')
        .whereBetween('created_at', [start.toDate(), end.toDate()])
        .update({ aggregated: true });

    logger.info(`[AGGREGATION] Finished. Processed ${rawData.length} stations.`);

  } catch (error) {
    logger.error(`[AGGREGATION] Error: ${error}`);
  }
}

// Scheduler: Run at :50 every hour (10 minutes before sync at :00)
// This ensures data for the previous hour is aggregated and ready for sync
export const aggregationScheduler = CronJob.schedule(process.env.AGGREGATION_CRON || "50 * * * *", async () => {
    await runAggregation();
});
