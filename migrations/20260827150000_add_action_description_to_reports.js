/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('reports');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('reports', 'action_description');
    if (!hasColumn) {
      await knex.schema.table('reports', function(table) {
        table.text('action_description').nullable().comment('Deskripsi tindakan perbaikan / tindak lanjut teknisi');
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('reports');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('reports', 'action_description');
    if (hasColumn) {
      await knex.schema.table('reports', function(table) {
        table.dropColumn('action_description');
      });
    }
  }
};

