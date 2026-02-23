/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('maintenance_logs', function(table) {
    table.string('progress').nullable(); // 'Pengerjaan', 'Selesai'
    table.integer('report_id').nullable().index(); // FK to reports.id
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('maintenance_logs', function(table) {
    table.dropColumn('progress');
    table.dropColumn('report_id');
  });
};
