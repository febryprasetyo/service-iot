/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('mqtt_datas', 'created_at');
  if (!hasColumn) {
    await knex.schema.table('mqtt_datas', function(table) {
      // Add created_at column with default NOW() in WIB timezone
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      
      // Add index for better query performance
      table.index('created_at');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('mqtt_datas', function(table) {
    table.dropIndex('created_at');
    table.dropColumn('created_at');
  });
};
