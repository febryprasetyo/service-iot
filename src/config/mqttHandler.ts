import * as Mqtt from 'mqtt'
import {db} from '../utils/util';
import 'dotenv/config';

var brokerUrl: any = process.env.MQTT_BROKER_URL
var mqttTopic: any = process.env.MQTT_TOPIC
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
      console.log(message.toString());
      const jsonString = JSON.parse(message.toString());
      console.log('jsonString : ',jsonString['data'])

      let uuid = jsonString['uuid']
      let project = jsonString['project']

      let dataStream = jsonString['data'] && jsonString['data'].length > 0 ? jsonString['data'] : []
      for (let i = 0; i < dataStream.length; i++) {
        const el = dataStream[i];
        let checkData = await db.select(db.raw(`*`)).from('watermonitoringv2').whereRaw(`uuid = ? AND project = ? AND time = ?`, [uuid, project, el['time']])

        if (checkData.length === 0) {
          await db('watermonitoringv2')
          .insert({
            uuid: uuid,
            project: project,
            time: el['time'],
            temperature: el['Tempertature'],
            do_: el['DO'],
            tur: el['TUR'],
            ct: el['CT'],
            ph: el['pH'],
            orp: el['ORP'],
            bod: el['BOD'],
            cod: el['COD'],
            tss: el['TSS'],
            n: el['N'],
            no3_n: el['NO3_N'],
            no2: el['NO2'],
            depeth: el['Depeth'],
          })
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