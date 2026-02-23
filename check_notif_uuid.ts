
import db from './src/config/database';

async function check() {
    const notifs = await db('notifications').where({ uuid: '240305005323720' }).orderBy('created_at', 'desc');
    console.log(JSON.stringify(notifs, null, 2));
    process.exit(0);
}

check();
