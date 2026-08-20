/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Upgrade notifications table
  const hasNotificationsTable = await knex.schema.hasTable('notifications');
  if (hasNotificationsTable) {
    await knex.schema.table('notifications', function(table) {
      table.string('category', 50).nullable().defaultTo('system');
      table.string('severity', 20).nullable().defaultTo('info');
      table.string('title', 255).nullable();
      table.string('entity_type', 50).nullable();
      table.string('entity_id', 100).nullable();
      table.string('action_url', 255).nullable();
      table.jsonb('metadata').nullable();
      table.string('target_role', 50).nullable().defaultTo('all');
    });
  }

  // 2. Create user_notification_reads table for multi-user read state tracking
  const hasUserReadsTable = await knex.schema.hasTable('user_notification_reads');
  if (!hasUserReadsTable) {
    await knex.schema.createTable('user_notification_reads', function(table) {
      table.bigIncrements('id').primary();
      table.integer('user_id').notNullable();
      table.bigInteger('notification_id').notNullable();
      table.timestamp('read_at').defaultTo(knex.fn.now());

      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.foreign('notification_id').references('notifications.id').onDelete('CASCADE');
      table.unique(['user_id', 'notification_id']);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_notification_reads');

  const hasNotificationsTable = await knex.schema.hasTable('notifications');
  if (hasNotificationsTable) {
    await knex.schema.table('notifications', function(table) {
      table.dropColumn('category');
      table.dropColumn('severity');
      table.dropColumn('title');
      table.dropColumn('entity_type');
      table.dropColumn('entity_id');
      table.dropColumn('action_url');
      table.dropColumn('metadata');
      table.dropColumn('target_role');
    });
  }
};
