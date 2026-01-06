
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('res_klhk', function(table) {
      table.text('payload').alter();
      table.text('status_desc').alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Reverting to varchar(300) might truncate data, but strictly speaking this is the reverse operation.
  // In practice, we might not want to revert this if data is large.
  return knex.schema.alterTable('res_klhk', function(table) {
      table.string('payload', 300).alter();
      table.string('status_desc', 300).alter();
  });
};

