import { db } from './util';
import connection from '../config/redis';
import { checkRationality } from './ikaCalculator';

/**
 * Helper to get sensor data with status and applied overrides.
 * logic:
 * 1. Check Redis Maintenance. If active -> Override all values & statuses.
 * 2. If Normal, Check DB `hourly_sensor_status` (latest).
 * 3. Use status from DB or default 'NORMAL'.
 * 4. If Status is 'OFFLINE' (previously BROKEN), override value to -3.
 */
export async function getMonitoringDataWithStatus(uuid: string, rawData: any, isAlive: boolean) {
    if (!rawData) return null;

    // --- Redis Maintenance Check ---
    const redisKey = `maintenance:${uuid}`;
    const maintenanceStatus = await connection.get(redisKey);
    
    // Fetch latest granular status from DB
    const statusRow = await db('hourly_sensor_status')
        .where({ uuid })
        .orderBy('hour_timestamp', 'desc')
        .first();

    // Fetch latest IKA data from DB (hourly_sensor_data)
    const ikaRow = await db('hourly_sensor_data')
        .where({ uuid })
        .orderBy('hour_timestamp', 'desc')
        .first();

    let isMaintenance = false;
    let maintenanceCode = '0';
    let maintenanceLabel = 'NORMAL';

    if (maintenanceStatus) {
        isMaintenance = true;
        if (maintenanceStatus === 'maintenance') {
            maintenanceCode = '-1';
            maintenanceLabel = 'MAINTENANCE';
        } else if (maintenanceStatus === 'calibration') {
            maintenanceCode = '-2';
            maintenanceLabel = 'CALIBRATION';
        } else if (maintenanceStatus === 'stop') {
            maintenanceCode = '0';
            maintenanceLabel = 'STOPPED';
        }
    }

    const getValAndStatus = (val: any, param: string) => {
        if (!isAlive) return { value: '0', status: 'STOPPED' }; // Or 'OFFLINE'? Using '0' as per existing logic

        if (isMaintenance) {
            return { value: maintenanceCode, status: maintenanceLabel };
        }

        // Normal Mode
        let currentStatus = 'NORMAL';
        if (statusRow) {
            const statusCol = `status_${param}`;
            currentStatus = statusRow[statusCol] || 'NORMAL';
        }

        let finalVal = val;
        
        // If OFFLINE (was BROKEN), set to -3
        if (currentStatus === 'OFFLINE' || currentStatus === 'BROKEN') {
            finalVal = '-3';
            currentStatus = 'OFFLINE'; 
        }

        return { value: finalVal, status: currentStatus };
    };

    const processedSensors = {
            temperature: getValAndStatus(rawData.temperature, 'temp').value,
            status_temperature: getValAndStatus(rawData.temperature, 'temp').status,

            do_: getValAndStatus(rawData.do_, 'do').value,
            status_do: getValAndStatus(rawData.do_, 'do').status,

            tur: getValAndStatus(rawData.tur, 'tur').value,
            status_tur: getValAndStatus(rawData.tur, 'tur').status,

            ph: getValAndStatus(rawData.ph, 'ph').value,
            status_ph: getValAndStatus(rawData.ph, 'ph').status,

            bod: getValAndStatus(rawData.bod, 'bod').value,
            status_bod: getValAndStatus(rawData.bod, 'bod').status,

            cod: getValAndStatus(rawData.cod, 'cod').value,
            status_cod: getValAndStatus(rawData.cod, 'cod').status,

            tss: getValAndStatus(rawData.tss, 'tss').value,
            status_tss: getValAndStatus(rawData.tss, 'tss').status,

            depth: getValAndStatus(rawData.depth, 'depth').value,
            status_depth: getValAndStatus(rawData.depth, 'depth').status,

            no3_3: getValAndStatus(rawData.no3_3, 'no3').value,
            status_no3_3: getValAndStatus(rawData.no3_3, 'no3').status,

            n: getValAndStatus(rawData.n, 'n').value,
            status_n: getValAndStatus(rawData.n, 'n').status,

            ct: getValAndStatus(rawData.ct, 'ct').value,
            status_ct: getValAndStatus(rawData.ct, 'ct').status,

            no2: getValAndStatus(rawData.no2, 'no2').value,
            status_no2: getValAndStatus(rawData.no2, 'no2').status,

            orp: getValAndStatus(rawData.orp, 'orp').value,
            status_orp: getValAndStatus(rawData.orp, 'orp').status,
    };

    // Prepare IKA Data
    let ikaData = {
        score: 0,
        category: "UNKNOWN",
        param_dominan: "-",
        validation: "Valid", // Default
        indices: [] as any[]
    };

    // Rationality Check
    const dataForCheck = {
        ph: processedSensors.ph,
        temp: processedSensors.temperature,
        do_: processedSensors.do_,
        cod: processedSensors.cod,
        bod: processedSensors.bod,
        tss: processedSensors.tss,
        tds: processedSensors.ct, // ct maps to TDS
        nitrat: processedSensors.no3_3,
        amonia: processedSensors.n
    };

    const validationResult = checkRationality(dataForCheck);
    ikaData.validation = validationResult.message;

    if (isMaintenance) {
        ikaData.category = maintenanceLabel;
        ikaData.validation = "Maintenance Mode"; 
        // Default 0 for others
    } else {
        if (ikaRow) {
            ikaData.score = ikaRow.ika_score || 0;
            ikaData.category = ikaRow.ika_category || "UNKNOWN";
            ikaData.param_dominan = ikaRow.param_dominan || "-";
            ikaData.indices = [
                { name: 'amonia', value: ikaRow.ika_idx_amonia || 0 },
                { name: 'bod', value: ikaRow.ika_idx_bod || 0 },
                { name: 'cod', value: ikaRow.ika_idx_cod || 0 },
                { name: 'do', value: ikaRow.ika_idx_do || 0 },
                { name: 'nitrat', value: ikaRow.ika_idx_nitrat || 0 },
                { name: 'ph', value: ikaRow.ika_idx_ph || 0 },
                { name: 'tds', value: ikaRow.ika_idx_tds || 0 },
                { name: 'tss', value: ikaRow.ika_idx_tss || 0 },
            ];
        }
    }

    return {
        sensors: processedSensors,
        ika: ikaData
    };
}
