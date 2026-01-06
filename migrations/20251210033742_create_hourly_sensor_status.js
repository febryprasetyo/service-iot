/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('hourly_sensor_status');
  if (!exists) {
    return knex.schema.createTable('hourly_sensor_status', function(table) {
      table.string('uuid').notNullable();
      table.timestamp('hour_timestamp').notNullable();
      
      // Status columns for each parameter
      // Values: 'NORMAL', 'BROKEN', 'ESTIMATED', 'MAINTENANCE', 'CALIBRATION', 'STOPPED'
      table.string('status_temp').defaultTo('NORMAL');
      table.string('status_do').defaultTo('NORMAL');
      table.string('status_ph').defaultTo('NORMAL');
      table.string('status_tur').defaultTo('NORMAL');
      table.string('status_ct').defaultTo('NORMAL');
      table.string('status_cod').defaultTo('NORMAL');
      table.string('status_bod').defaultTo('NORMAL');
      table.string('status_tss').defaultTo('NORMAL');
      table.string('status_n').defaultTo('NORMAL');
      table.string('status_no2').defaultTo('NORMAL');
      table.string('status_no3').defaultTo('NORMAL');
      table.string('status_depth').defaultTo('NORMAL');
      table.string('status_orp').defaultTo('NORMAL');

      table.primary(['uuid', 'hour_timestamp']);
      table.index('uuid');
      table.index('hour_timestamp');
      table.timestamps(true, true);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('hourly_sensor_status');
};
