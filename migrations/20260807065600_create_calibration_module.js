exports.up = function(knex) {
  return knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      return knex.schema
        .createTable('master_parameters', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('unit');
      table.timestamps(true, true);
    })
    .createTable('calibrations', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('report_no').notNullable();
      table.integer('station_id').notNullable(); // Assuming stations uses integer IDs
      table.date('calibration_date').notNullable();
      table.string('contact_person').notNullable();
      table.string('phone').notNullable();
      table.text('notes');
      table.integer('officer_id').notNullable(); // Assuming users uses integer IDs
      table.string('status').notNullable().defaultTo('draft'); // draft, submitted, approved
      table.uuid('verification_uuid').notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
      table.timestamps(true, true);
    })
    .createTable('calibration_details', function(table) {
      table.increments('id').primary();
      table.uuid('calibration_id').references('id').inTable('calibrations').onDelete('CASCADE');
      table.integer('parameter_id').references('id').inTable('master_parameters').onDelete('CASCADE');
      table.string('coeff_type'); // K/B or K1-K6
      table.jsonb('coefficients'); // store k, b, k1-k6 flexibly
      table.string('calculation_result'); // PASS / FAILED
      table.string('remark');
      table.timestamps(true, true);
    })
    .createTable('calibration_detail_standards', function(table) {
      table.increments('id').primary();
      table.integer('calibration_detail_id').references('id').inTable('calibration_details').onDelete('CASCADE');
      table.string('crm_name').notNullable(); // e.g. "CRM TUR 4 NTU"
      table.decimal('crm_standard_value', 14, 4); 
      table.decimal('min_acceptable', 14, 4);
      table.decimal('max_acceptable', 14, 4);
      table.decimal('calibration_result', 14, 4); // user input
      table.timestamps(true, true);
    })
    .createTable('water_samples', function(table) {
      table.increments('id').primary();
      table.uuid('calibration_id').references('id').inTable('calibrations').onDelete('CASCADE');
      table.string('sample_name').notNullable(); // e.g., Aquades, River
      table.decimal('suhu', 10, 4);
      table.decimal('do', 10, 4);
      table.decimal('tur', 10, 4);
      table.decimal('tds', 10, 4);
      table.decimal('ph', 10, 4);
      table.decimal('orp', 10, 4);
      table.decimal('tss', 10, 4);
      table.decimal('bod', 10, 4);
      table.decimal('cod', 10, 4);
      table.decimal('amonia', 10, 4);
      table.decimal('nitrat', 10, 4);
      table.decimal('nitrit', 10, 4);
      table.decimal('kedalaman', 10, 4);
      table.timestamps(true, true);
    });
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('water_samples')
    .dropTableIfExists('calibration_detail_standards')
    .dropTableIfExists('calibration_details')
    .dropTableIfExists('calibrations')
    .dropTableIfExists('master_parameters');
};
