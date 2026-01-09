
import { db } from './utils/util';

async function checkStatus() {
  const uuids = [
    '240305005321338',
    '240305005321332',
    '240305005321322',
    '240305005321323'
  ];

  console.log("Checking status for UUIDs:", uuids);

  const data = await db('mqtt_monitoring')
    .select('uuid', 'read_status', 'pump_status', 'updated_at')
    .whereIn('uuid', uuids);

  console.table(data);
  process.exit(0);
}

checkStatus();
