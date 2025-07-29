import * as Mqtt from 'mqtt';
import { db, moment } from '../utils/util';
import 'dotenv/config';

var brokerUrl: any = process.env.MQTT_BROKER_URL;
var mqttTopic: any = process.env.MQTT_TOPIC;
var options: any = {
  clientId: process.env.MQTT_CLIENT_ID,
  port: parseInt(process.env.MQTT_PORT || '1883'),
  keepalive: parseInt(process.env.MQTT_KEEP_ALIVE || '60'),
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
};

// class MqttHandler {
//   public mqttClient: any;

//   connect() {
//     // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
//     this.mqttClient = Mqtt.connect(brokerUrl, options);

//     // Mqtt error calback
//     this.mqttClient.on('error', (err: any) => {
//       console.log(err);
//       this.mqttClient.end();
//     });

//     // Connection callback
//     this.mqttClient.on('connect', () => {
//       console.log(`mqtt client connected`);
//       this.mqttClient.subscribe(
//         mqttTopic,
//         function mqttSubribe(err: any, granted: any) {
//           // console.log('Subscribed to ' + mqttTopic);
//         }
//       );
//     });

//     this.mqttClient.on('message', async (topic: any, message: any) => {
//       const jsonString = JSON.parse(message.toString());
//       const uuid = jsonString['uuid'];
//       const dataStream = Array.isArray(jsonString['data'])
//         ? jsonString['data']
//         : [];

//       if (!uuid || dataStream.length === 0) return;

//       const trx = await db.transaction();
//       try {
//         // Ambil waktu insert terakhir dari db untuk uuid ini
//         const lastRow = await trx('mqtt_datas')
//           .where({ uuid })
//           .orderBy('time', 'desc')
//           .first();

//         let lastInsertTime = lastRow ? moment(lastRow.time) : null;

//         const stasiunList = await trx('devices')
//           .select('nama_stasiun')
//           .where('id_mesin', uuid);
//         if (stasiunList.length === 0) {
//           console.warn(`⚠️ Tidak ditemukan id_mesin: ${uuid}`);
//           await trx.rollback();
//           return;
//         }

//         const inserts = [];

//         for (const el of dataStream) {
//           const tmRaw = el['time'] || moment().format('DD-MM-YYYY HH:mm:ss');
//           const tm = moment(tmRaw, 'DD-MM-YYYY HH:mm:ss');

//           // Cek selisih waktu dengan insert terakhir
//           if (!lastInsertTime || tm.diff(lastInsertTime, 'minutes') >= 5) {
//             inserts.push({
//               uuid,
//               time: tm.format('YYYY-MM-DD HH:mm:ss'),
//               temperature: parseFloat(el['Temperature']).toFixed(2),
//               do_: parseFloat(el['DO']).toFixed(2),
//               tur: parseFloat(el['TUR']).toFixed(2),
//               ph: parseFloat(el['PH']).toFixed(2),
//               bod: parseFloat(el['BOD']).toFixed(2),
//               cod: parseFloat(el['COD']).toFixed(2),
//               tss: parseFloat(el['TSS']).toFixed(2),
//               depth: parseFloat(el['DEPTH']).toFixed(2),
//               no3_3: parseFloat(el['NO3-3']).toFixed(2),
//               n: parseFloat(el['N']).toFixed(2),
//               ct: parseFloat(el['CT']).toFixed(2),
//               no2: parseFloat(el['NO2']).toFixed(2),
//               orp: parseFloat(el['ORP']).toFixed(2),
//               'lgnh4+': el['LgNH4+'],
//               liquid: el['Liquid'],
//               id_stasiun: stasiunList[0].nama_stasiun || '-',
//               is_success: false,
//               last_update: moment().utcOffset(7),
//             });

//             // update lastInsertTime agar tidak insert dua kali dalam loop
//             lastInsertTime = tm;
//           }
//         }

//         if (inserts.length > 0) {
//           await trx('mqtt_datas').insert(inserts);
//           console.log(`✅ Inserted ${inserts.length} data for uuid ${uuid}`);
//         } else {
//           console.log(
//             `ℹ️ Tidak ada data baru untuk uuid ${uuid} (interval < 5m)`
//           );
//         }

//         await trx.commit();
//       } catch (err) {
//         await trx.rollback();
//         console.error('❌ MQTT insert failed:', err);
//       }
//     });

//     this.mqttClient.on('close', () => {
//       console.log(`mqtt client disconnected`);
//     });
//   }
// }

// export = MqttHandler;


/* back running saat ini */
// class MqttHandler {
//   public mqttClient: any;
//   // private lastInsertCache: Map<string, moment.Moment> = new Map(); // Cache per UUID
//   private lastInsertMap: Record<string, moment.Moment> = {};

//   connect() {
//     this.mqttClient = Mqtt.connect(brokerUrl, options);

//     this.mqttClient.on('error', (err: any) => {
//       console.log(err);
//       this.mqttClient.end();
//     });

//     this.mqttClient.on('connect', () => {
//       console.log(`mqtt client connected`);
//       this.mqttClient.subscribe(mqttTopic, function (err: any) {
//         if (err) console.error('MQTT Subscribe error:', err);
//       });
//     });

//     this.mqttClient.on('message', async (topic: any, message: any) => {
//       const jsonString = JSON.parse(message.toString());
//       const uuid = jsonString['uuid'];
//       const dataStream = Array.isArray(jsonString['data'])
//         ? jsonString['data']
//         : [];
//       if (!uuid || dataStream.length === 0) return;

//       const trx = await db.transaction();
//       try {
//         const stasiunList = await trx('devices')
//           .select('nama_stasiun')
//           .where('id_mesin', uuid);

//         if (stasiunList.length === 0) {
//           console.warn(`⚠️ Tidak ditemukan id_mesin: ${uuid}`);
//           await trx.rollback();
//           return;
//         }

//         const inserts = [];

//         for (const el of dataStream) {
//           const tmRaw = el['time'] || moment().format('DD-MM-YYYY HH:mm:ss');
//           const tm = moment(tmRaw, 'DD-MM-YYYY HH:mm:ss');

//           for (const stasiun of stasiunList) {
//             const id_stasiun = stasiun.nama_stasiun;

//             const lastInsert = this.lastInsertMap[id_stasiun];
//             if (!lastInsert || tm.diff(lastInsert, 'minutes') >= 5) {
//               inserts.push({
//                 uuid,
//                 time: tm.format('YYYY-MM-DD HH:mm:ss'),
//                 temperature: parseFloat(el['Temperature']).toFixed(2),
//                 do_: parseFloat(el['DO']).toFixed(2),
//                 tur: parseFloat(el['TUR']).toFixed(2),
//                 ph: parseFloat(el['PH']).toFixed(2),
//                 bod: parseFloat(el['BOD']).toFixed(2),
//                 cod: parseFloat(el['COD']).toFixed(2),
//                 tss: parseFloat(el['TSS']).toFixed(2),
//                 depth: parseFloat(el['DEPTH']).toFixed(2),
//                 no3_3: parseFloat(el['NO3-3']).toFixed(2),
//                 n: parseFloat(el['N']).toFixed(2),
//                 ct: parseFloat(el['CT']).toFixed(2),
//                 no2: parseFloat(el['NO2']).toFixed(2),
//                 orp: parseFloat(el['ORP']).toFixed(2),
//                 'lgnh4+': el['LgNH4+'],
//                 liquid: el['Liquid'],
//                 id_stasiun,
//                 is_success: false,
//                 // last_update: moment().utcOffset(7),
//               });

//               this.lastInsertMap[id_stasiun] = tm;
//             }
//           }
//         }

//         if (inserts.length > 0) {
//           await trx('mqtt_datas').insert(inserts);
//           console.log(`✅ Inserted ${inserts.length} data for uuid ${uuid}`);
//         } else {
//           console.log(
//             `ℹ️ Tidak ada data baru untuk uuid ${uuid} (interval < 5m)`
//           );
//         }

//         await trx.commit();
//       } catch (err) {
//         await trx.rollback();
//         console.error('❌ MQTT insert failed:', err);
//       }
//     });

//     this.mqttClient.on('close', () => {
//       console.log(`mqtt client disconnected`);
//     });
//   }
// }

// export = MqttHandler;


/* * back running saat ini */
import PQueue from 'p-queue';




const queue = new PQueue({ concurrency: 5 });

class MqttHandler {
  public mqttClient!: Mqtt.MqttClient;

  connect() {
    this.mqttClient = Mqtt.connect(brokerUrl, options);

    this.mqttClient.on('error', (err: any) => {
      console.error('❌ MQTT Error:', err);
      this.mqttClient.end();
    });

    this.mqttClient.on('connect', () => {
      console.log('✅ MQTT connected');
      this.mqttClient.subscribe(mqttTopic, (err) => {
        if (err) {
          console.error('❌ Failed to subscribe:', err);
        } else {
          console.log('📡 Subscribed to topic:', mqttTopic);
        }
      });
    });

    this.mqttClient.on('message', (topic, message) => {
      queue.add(() => this.handleMessage(topic, message));
    });

    this.mqttClient.on('close', () => {
      console.log('🚪 MQTT disconnected');
    });
  }

  async handleMessage(topic: string, message: Buffer) {
    try {
      const jsonString = JSON.parse(message.toString());
      const uuid = jsonString['uuid'];
      const dataStream = Array.isArray(jsonString['data']) ? jsonString['data'] : [];

      if (!uuid || dataStream.length === 0) return;

      const trx = await db.transaction();

      try {
        const [device] = await trx('devices').select('nama_stasiun').where({ id_mesin: uuid });
        const namaStasiun = device?.nama_stasiun || '-';

        const incomingTimes = dataStream.map((el) =>
          el['time']
            ? moment(el['time'], 'DD-MM-YYYY HH:ss:mm').format('YYYY-MM-DD HH:mm:ss')
            : moment().format('YYYY-MM-DD HH:mm:ss')
        );

        const existing = await trx('mqtt_datas')
          .whereIn('time', incomingTimes)
          .andWhere({ uuid })
          .select('time');

        const existingSet = new Set(existing.map((e: { time: string }) => moment(e.time).format('YYYY-MM-DD HH:mm:ss')));

        const payloads = dataStream
          .map((el) => {
            const tm = el['time']
              ? moment(el['time'], 'DD-MM-YYYY HH:ss:mm').format('YYYY-MM-DD HH:mm:ss')
              : moment().format('YYYY-MM-DD HH:mm:ss');

            if (existingSet.has(tm)) return null;

            return {
              uuid,
              time: tm,
              temperature: parseFloat(el['Temperature'])?.toFixed(2),
              do_: parseFloat(el['DO'])?.toFixed(2),
              tur: parseFloat(el['TUR'])?.toFixed(2),
              ph: parseFloat(el['PH'])?.toFixed(2),
              bod: parseFloat(el['BOD'])?.toFixed(2),
              cod: parseFloat(el['COD'])?.toFixed(2),
              tss: parseFloat(el['TSS'])?.toFixed(2),
              depth: parseFloat(el['DEPTH'])?.toFixed(2),
              no3_3: parseFloat(el['NO3-3'])?.toFixed(2),
              n: parseFloat(el['N'])?.toFixed(2),
              ct: parseFloat(el['CT'])?.toFixed(2),
              no2: parseFloat(el['NO2'])?.toFixed(2),
              orp: parseFloat(el['ORP'])?.toFixed(2),
              'lgnh4+': el['LgNH4+'],
              liquid: el['Liquid'],
              id_stasiun: namaStasiun,
              is_success: false,
            };
          })
          .filter(Boolean); // Remove nulls

        if (payloads.length > 0) {
          await trx('mqtt_datas').insert(payloads);

          console.log(`✅ Inserted ${payloads.length} records for UUID: ${uuid}`);
        } else {
          console.log(`ℹ️ Tidak ada data baru untuk UUID: ${uuid}`);
        }

        await trx.commit();
      } catch (err) {
        await trx.rollback();
        console.error('❌ Transaction failed for UUID:', uuid, err);
      }
    } catch (err) {
      console.error('❌ Failed to parse message:', err);
    }
  }
}

export = MqttHandler;
