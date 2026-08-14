exports.up = function(knex) {
  return knex.schema.alterTable('calibration_details', (table) => {
    table.decimal('crm_reference_value', 14, 4).nullable().defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('calibration_details', (table) => {
    table.dropColumn('crm_reference_value');
  });
};
