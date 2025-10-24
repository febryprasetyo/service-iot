import fs from 'fs';
import path from 'path';
import type { Knex } from 'knex';
import { logger, db, validateParams, sendResponseCustom, moment, 
  sendResponseError, errorCodes, createError, validateParamsAll, getConfig }
   from '../utils/util';


   const LOG_DIR = path.resolve(__dirname, process.env.ASSET_DIR || 'logs'); // Direktori log

   function writeRetentionLog(message: string) {
  const now = moment(); // gunakan moment dari util
    const logFileName = `retention-${now.format('YYYY-MM')}.log`; // 📁 log per bulan

  const logFilePath = path.join(LOG_DIR, logFileName);

  // Tambahkan timestamp ke setiap log baris
  const timeStampedMessage = `[${now.format('YYYY-MM-DD HH:mm:ss')}] ${message}\n`;

  // Pastikan direktori ada
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // Simpan ke file
  fs.appendFileSync(logFilePath, timeStampedMessage, 'utf8');
}
// Fungsi retention utama
export async function runRetention(trx?: Knex.Transaction) {
  const now = moment();
  logger.info('🕑 Menjalankan retensi data manual...');
  writeRetentionLog('🕑 Menjalankan retensi data manual...');

  const transaction = trx || (await db.transaction());

  try {
    await transaction.raw(`
      INSERT INTO mqtt_datas_archive (
        id, uuid, time, temperature, do_, tur, ph, bod, cod, tss, depth, no3_3,
        n, ct, no2, orp, id_stasiun, is_success, res_menlhk, sync_time
      )
      SELECT
        id, uuid, time, temperature, do_, tur, ph, bod, cod, tss, depth, no3_3,
        n, ct, no2, orp, id_stasiun, is_success, res_menlhk, sync_time
      FROM mqtt_datas
      WHERE is_success = true
    `);

    await transaction.raw(`
      DELETE FROM mqtt_datas
      WHERE is_success = true
    `);

    if (!trx) await transaction.commit();

    const successMsg = '✅ Retensi data selesai: data lama dipindahkan ke arsip.';
    logger.info(successMsg);
    writeRetentionLog(successMsg);
  } catch (err: any) {
    if (!trx) await transaction.rollback();

    const errorMsg = `❌ Retensi gagal: ${err?.message || err}`;
    logger.error(errorMsg);
    writeRetentionLog(errorMsg);

    throw err;
  }
}
