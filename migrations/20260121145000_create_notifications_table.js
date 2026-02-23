/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.increments('id').primary();
    table.string('type').notNullable(); // offline, maintenance, logbook
    table.string('uuid').notNullable().index(); // related station uuid
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.string('created_by').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notifications');
};
