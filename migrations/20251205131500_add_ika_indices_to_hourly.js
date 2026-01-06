exports.up = function(knex) {
  return knex.schema.table('hourly_sensor_data', function(t) {
    // Individual IKA Indices
    t.float('ika_idx_amonia').nullable();
    t.float('ika_idx_bod').nullable();
    t.float('ika_idx_cod').nullable();
    t.float('ika_idx_do').nullable();
    t.float('ika_idx_nitrat').nullable();
    t.float('ika_idx_ph').nullable();
    t.float('ika_idx_tds').nullable();
    t.float('ika_idx_tss').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('hourly_sensor_data', function(t) {
    t.dropColumns(
      'ika_idx_amonia', 
      'ika_idx_bod', 
      'ika_idx_cod', 
      'ika_idx_do', 
      'ika_idx_nitrat', 
      'ika_idx_ph', 
      'ika_idx_tds', 
      'ika_idx_tss'
    );
  });
};
