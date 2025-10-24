export async function up(knex) {
  await knex.schema.createTable('paket_data', (table) => {
    table.increments('id').primary();
    table.date('tanggal').notNullable();
    table.string('nama_paket').notNullable();
    table.string('masa_aktif').notNullable();
    table.decimal('harga', 12, 2).notNullable();
    table.string('pic').notNullable();
    table.timestamps(true, true); // created_at, updated_at
  });

  await knex.schema.createTable('token_listrik', (table) => {
    table.increments('id').primary();
    table.date('tanggal').notNullable();
    table.string('nama').notNullable();
    table.decimal('kwh', 12, 2).notNullable();
    table.decimal('harga', 12, 2).notNullable();
    table.string('pic').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('token_listrik');
  await knex.schema.dropTableIfExists('paket_data');
}
