import cron from 'node-cron';
import type { Knex } from 'knex';
import { logger, db, validateParams, sendResponseCustom, moment, 
  sendResponseError, errorCodes, createError, validateParamsAll, getConfig }
   from '../utils/util';
// Fungsi retention utama
export async function runRetention(trx?: Knex.Transaction) {
  logger.info('🕑 Menjalankan retensi data manual...');

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

    logger.info('✅ Retensi data selesai: data lama dipindahkan ke arsip.');
  } catch (err) {
    if (!trx) await transaction.rollback();
    logger.error('❌ Retensi gagal:', err);
    throw err;
  }
}