/**
 * Replaces the single calibration date with a required date range and removes
 * contact fields that are not part of the Calibration Report input contract.
 * Existing records retain their prior date as both range boundaries.
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('calibrations', (table) => {
    table.renameColumn('calibration_date', 'calibration_start_date');
    table.dropColumn('contact_person');
    table.dropColumn('phone');
  });

  await knex.schema.alterTable('calibrations', (table) => {
    table.date('calibration_end_date').nullable();
  });

  await knex('calibrations').update({
    calibration_end_date: knex.ref('calibration_start_date')
  });

  await knex.schema.alterTable('calibrations', (table) => {
    table.date('calibration_end_date').notNullable().alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('calibrations', (table) => {
    table.date('calibration_date').nullable();
  });

  await knex('calibrations').update({
    calibration_date: knex.ref('calibration_start_date')
  });

  await knex.schema.alterTable('calibrations', (table) => {
    table.dropColumn('calibration_start_date');
    table.dropColumn('calibration_end_date');
    table.string('contact_person').nullable();
    table.string('phone').nullable();
  });
};
