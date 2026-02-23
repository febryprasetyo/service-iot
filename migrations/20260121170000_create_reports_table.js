/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reports', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('station_uuid').notNullable().index(); // Foreign key manually handled for flexibility
    table.text('description').nullable();
    table.integer('pic_id').nullable(); // FK to users.id
    table.string('pic_name').notNullable();
    table.string('category').notNullable(); // 'Perbaikan', 'Penggantian Part'
    table.string('status').defaultTo('Open'); // 'Open', 'Eskalasi', 'Selesai'
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('reports');
};
