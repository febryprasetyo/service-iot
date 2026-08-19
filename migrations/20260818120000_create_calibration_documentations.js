exports.up = function(knex) {
  return knex.schema.createTable('calibration_documentations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('calibration_id').notNullable().references('id').inTable('calibrations').onDelete('CASCADE');
    table.integer('calibration_detail_id').notNullable().references('id').inTable('calibration_details').onDelete('CASCADE');
    table.integer('parameter_id').references('id').inTable('master_parameters').onDelete('SET NULL');
    table.string('photo_type', 10).notNullable(); // 'before' or 'after'
    table.string('storage_key', 500).notNullable();
    table.string('mime_type', 50).notNullable().defaultTo('image/webp');
    table.integer('file_size').notNullable();
    table.integer('width').nullable();
    table.integer('height').nullable();
    table.string('checksum', 100).notNullable();
    table.string('uploaded_by', 100).nullable();
    table.timestamps(true, true);

    table.unique(['calibration_detail_id', 'photo_type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('calibration_documentations');
};