/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.hasColumn('sensor_data', 'nama_stasiun').then(function(existsNama) {
    return knex.schema.hasColumn('sensor_data', 'station_id').then(function(existsStation) {
      
      if (existsNama && existsStation) {
        // KASUS 1: Keduanya ada -> Hapus station_id yang redundant
        return knex.schema.table('sensor_data', function(t) {
          t.dropColumn('station_id');
        });
      } else if (!existsNama && existsStation) {
        // KASUS 2: Hanya station_id ada -> Rename jadi nama_stasiun
        return knex.schema.table('sensor_data', function(t) {
          t.renameColumn('station_id', 'nama_stasiun');
        });
      } else if (!existsNama && !existsStation) {
        // KASUS 3: Tidak ada keduanya -> Buat nama_stasiun
        return knex.schema.table('sensor_data', function(t) {
          t.string('nama_stasiun', 255).nullable();
        });
      }
      // KASUS 4: Hanya nama_stasiun ada -> Do nothing (sudah benar)
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.hasColumn('sensor_data', 'nama_stasiun').then(function(existsNama) {
    if (existsNama) {
      return knex.schema.hasColumn('sensor_data', 'station_id').then(function(existsStation) {
        if (!existsStation) {
          // Hanya rename jika station_id BELUM ada
          return knex.schema.table('sensor_data', function(t) {
            t.renameColumn('nama_stasiun', 'station_id');
          });
        }
      });
    }
  });
};
