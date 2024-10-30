import * as Mqtt from 'mqtt'
import {db, moment} from '../utils/util';
import 'dotenv/config';

var brokerUrl: any = process.env.MQTT_BROKER_URL
var mqttTopic: any = process.env.MQTT_CLIENT_ID
var options: any = {
  clientId: process.env.MQTT_CLIENT_ID,
  port: parseInt(process.env.MQTT_PORT || '1883'),
  keepalive: parseInt(process.env.MQTT_KEEP_ALIVE || '60'),
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
};

class MqttHandler {
  public mqttClient: any
  
  connect() {
    // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
    this.mqttClient = Mqtt.connect(brokerUrl, options);

    // Mqtt error calback
    this.mqttClient.on('error', (err: any) => {
      console.log(err);
      this.mqttClient.end();
    });

    // Connection callback
    this.mqttClient.on('connect', () => {
      console.log(`mqtt client connected`);
      this.mqttClient.subscribe(mqttTopic, function mqttSubribe(err: any, granted: any) {
        console.log('Subscribed to ' + mqttTopic)
      });
    });

    // mqtt subscriptions

    // When a message arrives, console.log it
    this.mqttClient.on('message', async function (topic: any, message: any) {
      console.log('Topic : ',topic);
      console.log(message.toString());
      const jsonString = JSON.parse(message.toString());
      // console.log('jsonString : ',jsonString)

      let uuid = jsonString['uuid']
      // let project = jsonString['project']

      let dataStream = jsonString['data'] && jsonString['data'].length > 0 ? jsonString['data'] : []
      for (let i = 0; i < dataStream.length; i++) {
        let trx
        try {
          const el = dataStream[i];
          // let checkData = await db.select(db.raw(`*`)).from('mqtt_datas').whereRaw(`uuid = ? AND project = ? AND time = ?`, [uuid, project, el['time']])
          let tm = el['time'] ? moment(el['time'],  "DD-MM-YYYY HH:ss:mm").format('YYYY-MM-DD HH:ss:mm') : moment().format('YYYY-MM-DD HH:ss:mm')
          console.log(`----------------------------- tm : `, tm)
          trx = await db.transaction()
          let checkData = await trx.select(trx.raw(`*`)).from('mqtt_datas').whereRaw(`uuid = ? AND time = ?`, [uuid, tm])
  
          if (checkData.length === 0) {
            await trx('mqtt_datas')
            .insert({
              uuid: uuid,
              time: tm,
              temperature: el['Temperature'].toFixed(2),
              do_: el['DO'].toFixed(2),
              tur: el['TUR'].toFixed(2),
              ph: el['PH'].toFixed(2),
              bod: el['BOD'].toFixed(2),
              cod: el['COD'].toFixed(2),
              tss: el['TSS'].toFixed(2),
              depth: el['DEPTH'].toFixed(2),
              no3_3: el['NO3-3'].toFixed(2),
              n: el['N'].toFixed(2),
              ct: el['CT'].toFixed(2),
              no2: el['NO2'].toFixed(2),
              orp: el['ORP'].toFixed(2),
              'lgnh4+': el['LgNH4+'],
              liquid: el['Liquid'],
            })
  
            let checkDataStasiun = await trx.select(trx.raw(`*`)).from('devices').whereRaw(`id_mesin = ?`, uuid)
  
            await trx('watermonitoring')
              .insert({
                uuid: uuid,
                id_stasiun: checkDataStasiun.length > 0 ? checkDataStasiun[0].nama_stasiun : '-',
                time: tm,
                temperature: el['Temperature'].toFixed(2),
                do_: el['DO'].toFixed(2),
                turbidity: el['TUR'].toFixed(2),
                ph: el['PH'].toFixed(2),
                bod: el['BOD'].toFixed(2),
                cod: el['COD'].toFixed(2),
                tss: el['TSS'].toFixed(2),
                waterlevel: el['DEPTH'].toFixed(2),
                no3: el['NO3-3'].toFixed(2),
                nh3n: el['N'].toFixed(2),
                tds: el['CT'].toFixed(2),
              })
          }

          await trx.commit()
          
        } catch (error) {
          if (trx) trx.rollback()
          console.log(`----------------------------- error mqtt data : `, error)
        } 

      }

      //process insert to DB
    });

    this.mqttClient.on('close', () => {
      console.log(`mqtt client disconnected`);
    });
  }

}

export = MqttHandler;