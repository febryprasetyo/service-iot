/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Update stations table
  await knex.schema.table('stations', function(table) {
    table.string('instrument_status', 50).defaultTo('NORMAL');
    table.date('next_calibration_date').nullable();
  });

  // Update maintenance_logs table
  await knex.schema.table('maintenance_logs', function(table) {
    table.string('activity_type', 50).nullable(); // KALIBRASI_RUTIN, REPAIR, PEMBERSIHAN, etc.
    table.text('description').nullable();
    table.string('photo_url', 255).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('maintenance_logs', function(table) {
    table.dropColumn('activity_type');
    table.dropColumn('description');
    table.dropColumn('photo_url');
  });

  await knex.schema.table('stations', function(table) {
    table.dropColumn('instrument_status');
    table.dropColumn('next_calibration_date');
  });
};
