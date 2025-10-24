/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    knex.schema.hasTable('sensor_stock').then(exists => {
      if (!exists) {
        return knex.schema.createTable('sensor_stock', table => {
          table.increments('id');
          table.string('products');
          table.string('serial_number');
          table.string('condition');
          table.timestamp('date_in');
          table.timestamp('date_out');
        });
      }
    }),

    knex.schema.hasTable('sensor_inventaris').then(exists => {
      if (!exists) {
        return knex.schema.createTable('sensor_inventaris', table => {
          table.increments('id');
          table.string('products');
          table.integer('qty');
          table.string('condition');
        });
      }
    }),

    knex.schema.hasTable('sensor_tracking').then(exists => {
      if (!exists) {
        return knex.schema.createTable('sensor_tracking', table => {
          table.increments('id');
          table.string('products');
          table.string('serial_number');
          table.string('nama_stasiun');
          table.string('pic');
          table.timestamp('created_at');
          table.timestamp('updated_at');
        });
      }
    }),

    knex.schema.hasTable('sensor_request').then(exists => {
      if (!exists) {
        return knex.schema.createTable('sensor_request', table => {
          table.increments('id');
          table.string('pic');
          table.string('products');
          table.string('stations');
          table.string('quantity');
          table.timestamp('request_date');
          table.string('status').defaultTo('pending');          // status approval
          table.string('process_stage').defaultTo('persiapan'); // tahapan proses
          table.text('note');                                   // alasan penolakan atau catatan
          table.date('approval_date');
          table.string('approved_by');
        });
      }
    })

  ]); 
    
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('sensor_request'),
    // knex.schema.dropTable('sensor_tracking'),
    // knex.schema.dropTable('sensor_inventaris'),
    // knex.schema.dropTable('sensor_stock')
  ]);

};
