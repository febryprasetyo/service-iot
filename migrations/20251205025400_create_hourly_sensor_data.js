exports.up = function(knex) {
  return knex.schema.createTable('hourly_sensor_data', function(t) {
    t.bigIncrements('id').primary();
    t.string('uuid', 200).notNullable();
    t.string('nama_stasiun', 255);
    t.timestamp('hour_timestamp', { useTz: true }).notNullable();

    // Aggregated sensor values
    t.float('temperature_avg');
    t.float('do_avg');
    t.float('ph_avg');
    t.float('tur_avg');
    t.float('ct_avg');
    t.float('cod_avg');
    t.float('bod_avg');
    t.float('tss_avg');
    t.float('n_avg');
    t.float('no2_avg');
    t.float('no3_3_avg');
    t.float('depth_avg');
    t.float('orp_avg');

    // Data quality
    t.integer('sample_count');

    // Water Quality Index
    t.float('ika_score');
    t.string('ika_category', 50); // 'Baik Sekali', 'Baik', 'Sedang', 'Buruk', 'Buruk Sekali'
    t.string('param_dominan', 50);
    t.float('nilai_index_dominan');

    // Sync tracking
    t.boolean('synced_to_klhk').defaultTo(false);
    t.timestamp('sync_attempted_at', { useTz: true });

    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    t.unique(['uuid', 'hour_timestamp']);
    t.index(['uuid', 'hour_timestamp']);
    t.index(['synced_to_klhk', 'hour_timestamp']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('hourly_sensor_data');
};
