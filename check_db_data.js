const { db, moment } = require('./src/utils/util');

async function checkData() {
    try {
        const dateStr = moment().format('YYYY-MM-DD');
        console.log(`Checking data for date: ${dateStr}`);
        
        const hours = ['14:00:00', '15:00:00'];
        
        for (const time of hours) {
            const timestamp = `${dateStr} ${time}`;
            const data = await db('hourly_sensor_data')
                .where('hour_timestamp', timestamp)
                .select('id', 'hour_timestamp', 'synced_to_klhk');
            
            console.log(`Data for ${time}:`, data.length, 'records');
            if (data.length > 0) {
                console.log(JSON.stringify(data[0], null, 2));
            }
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkData();
