exports.up = function(knex) {
  return knex.schema.table('mqtt_datas', function(t) {
    t.boolean('aggregated').defaultTo(false);
    t.index(['is_success', 'time'], 'idx_mqtt_datas_sync');
    t.index(['uuid', 'time'], 'idx_mqtt_datas_uuid_time');
    t.index(['aggregated', 'time'], 'idx_mqtt_datas_aggregated');
  });
};

exports.down = function(knex) {
  return knex.schema.table('mqtt_datas', function(t) {
    t.dropIndex([], 'idx_mqtt_datas_sync');
    t.dropIndex([], 'idx_mqtt_datas_uuid_time');
    t.dropIndex([], 'idx_mqtt_datas_aggregated');
    t.dropColumn('aggregated');
  });
};
