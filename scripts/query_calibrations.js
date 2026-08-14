const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();
  const res = await client.query("select id, report_no, station_id, status, verification_uuid, created_at from calibrations order by id desc limit 20");
  console.log(res.rows);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
