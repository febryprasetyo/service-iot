/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('maintenance_logs');
  if (!exists) {
    return knex.schema.createTable('maintenance_logs', function(table) {
      table.increments('id').primary();
      table.string('uuid').notNullable().index();
      table.string('status').notNullable(); // maintenance, calibration, stop, start (though start deletes logs usually, but history keeps 'start' action?)
      // User requested log history. "Start" action should probably be logged as "finish" or just "start" to indicate end of maintenance.
      table.string('created_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // return knex.schema.dropTableIfExists('maintenance_logs');
  // Safer to leave data in dev/prod usually, but for reversible migration:
  return knex.schema.dropTableIfExists('maintenance_logs');
};
