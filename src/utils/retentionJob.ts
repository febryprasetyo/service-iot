import cron from 'node-cron';
import { db } from './util';
import type { Knex } from 'knex';

// Fungsi retention utama
export async function runRetention(trx?: Knex.Transaction) {
  console.log('🕑 Menjalankan retensi data manual...');

  const transaction = trx || (await db.transaction());

  try {
    // Pindahkan data ke archive
    await transaction.raw(`
      INSERT INTO mqtt_datas_archive (
        uuid, time, temperature, do_, tur, ph, bod, cod, tss, depth, no3_3,
        n, ct, no2, orp, "lgnh4+", liquid, id_stasiun, is_success, res_menlhk, sync_time
      )
      SELECT
        uuid, time, temperature, do_, tur, ph, bod, cod, tss, depth, no3_3,
        n, ct, no2, orp, "lgnh4+", liquid, id_stasiun, is_success, res_menlhk, sync_time
      FROM mqtt_datas
      WHERE is_success = true
    `); // WHERE is_success = true AND time < NOW() - INTERVAL '1 day

    // Hapus dari tabel utama
    await transaction.raw(`
      DELETE FROM mqtt_datas
      WHERE is_success = true
    `);

    if (!trx) await transaction.commit();

    console.log('✅ Retensi data selesai: data lama dipindahkan ke arsip.');
  } catch (err) {
    if (!trx) await transaction.rollback();
    console.error('❌ Retensi gagal:', err);
  }
}

// Schedule harian via cron (jam 02:00)
cron.schedule('0 2 * * *', async () => {
  await runRetention();
});
