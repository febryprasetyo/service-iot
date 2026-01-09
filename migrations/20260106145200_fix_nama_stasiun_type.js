/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('sensor_data', function(t) {
      // Ubah tipe kolom nama_stasiun menjadi string (text/varchar)
      // Gunakan alter() agar knex melakukan alter column
      t.string('nama_stasiun', 255).alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    // Kembalikan ke integer (ini mungkin gagal jika ada data string, tapi untuk rollback kita coba)
    // Sebaiknya down ini hati-hati. 
  return knex.schema.alterTable('sensor_data', function(t) {
      // t.integer('nama_stasiun').alter(); // Berisiko, tapi sesuai konsep rollback
  });
};
