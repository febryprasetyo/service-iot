/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('stations');
  if (!hasTable) {
    return;
  }

  const hasAddress = await knex.schema.hasColumn('stations', 'address');
  if (!hasAddress) {
    await knex.schema.table('stations', (table) => {
      table.string('address', 500).nullable();
    });
  }

  const hasCoordinate = await knex.schema.hasColumn('stations', 'coordinate');
  if (!hasCoordinate) {
    await knex.schema.table('stations', (table) => {
      table.string('coordinate', 255).nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('stations');
  if (!hasTable) {
    return;
  }

  const hasAddress = await knex.schema.hasColumn('stations', 'address');
  if (hasAddress) {
    await knex.schema.table('stations', (table) => {
      table.dropColumn('address');
    });
  }

  const hasCoordinate = await knex.schema.hasColumn('stations', 'coordinate');
  if (hasCoordinate) {
    await knex.schema.table('stations', (table) => {
      table.dropColumn('coordinate');
    });
  }
};
