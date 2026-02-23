/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('paket_data', function(table) {
      table.string('billing_status').defaultTo('unbilled');
      table.string('reimbursement_status').defaultTo('pending');
    })
    .alterTable('token_listrik', function(table) {
      table.string('billing_status').defaultTo('unbilled');
      table.string('reimbursement_status').defaultTo('pending');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('paket_data', function(table) {
      table.dropColumn('billing_status');
      table.dropColumn('reimbursement_status');
    })
    .alterTable('token_listrik', function(table) {
      table.dropColumn('billing_status');
      table.dropColumn('reimbursement_status');
    });
};
