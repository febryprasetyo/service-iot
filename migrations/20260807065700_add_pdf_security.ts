import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Extend calibrations table
  await knex.schema.alterTable('calibrations', (table) => {
    table.jsonb('snapshot_data').nullable().comment('Immutable data snapshot');
    table.string('report_hash', 64).nullable().comment('SHA‑256 hash of generated PDF');
    table.integer('revision').defaultTo(0).notNullable().comment('Optimistic‑locking revision');
  });

  // Add revision to calibration_details
  await knex.schema.alterTable('calibration_details', (table) => {
    table.integer('revision').defaultTo(0).notNullable().comment('Optimistic‑locking revision');
  });

  // Audit trail table
  await knex.schema.createTable('calibration_audits', (table) => {
    table.increments('id').primary();
    table.uuid('calibration_id').references('id').inTable('calibrations').onDelete('CASCADE');
    table.string('action').notNullable();
    table.string('performed_by').notNullable();
    table.jsonb('changed_fields').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('calibrations', (table) => {
    table.dropColumn('snapshot_data');
    table.dropColumn('report_hash');
    table.dropColumn('revision');
  });

  await knex.schema.alterTable('calibration_details', (table) => {
    table.dropColumn('revision');
  });

  await knex.schema.dropTableIfExists('calibration_audits');
}
