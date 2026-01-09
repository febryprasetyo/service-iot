/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.hasTable('sensor_data').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('sensor_data', function(t) {
        t.string('uuid', 200).primary();
        t.string('nama_stasiun', 255).notNullable();
        t.timestamp('time', { precision: 6 }).notNullable();
        t.float('temperature');
        t.float('do_');
        t.float('tur');
        t.float('ct');
        t.float('ph');
        t.float('orp');
        t.float('bod');
        t.float('cod');
        t.float('tss');
        t.float('n');
        t.float('no2');
        t.float('no3_3');
        t.float('depth');
        t.boolean('pump_status');
        t.boolean('cv_status');
        t.boolean('read_status');
        t.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now());
        t.string('id_mesin', 100).unique();
        
        // Foreign key removed due to duplicate id_mesin values in devices table
        // t.foreign('uuid').references('id_mesin').inTable('devices').onDelete('SET NULL').onUpdate('CASCADE');
      });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sensor_data');
};
