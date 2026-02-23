
import db from './src/config/database';

async function check() {
    const notifs = await db('notifications').orderBy('created_at', 'desc').limit(20);
    console.log(JSON.stringify(notifs, null, 2));
    process.exit(0);
}

check();
