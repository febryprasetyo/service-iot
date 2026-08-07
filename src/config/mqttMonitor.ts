import * as Mqtt from 'mqtt';
import {db} from '../utils/util'; // knex instance
import dotenv from 'dotenv';
import log4js from 'log4js';
import chalk from 'chalk';

dotenv.config();
const logger = log4js.getLogger('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL;
const options = {
  port: parseInt(process.env.MQTT_PORT || '1883'),
  keepalive: parseInt(process.env.MQTT_KEEP_ALIVE || '60'),
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
};

const subtopic = process.env.MQTT_TOPIC || '#';

class MqttHandler {
  public mqttClient: Mqtt.MqttClient | null = null;

  async connect() {
    if (!brokerUrl) {
      throw new Error('MQTT_BROKER_URL is not defined in environment variables');
    }

    this.mqttClient = Mqtt.connect(brokerUrl, options);

    this.mqttClient.on('connect', () => {
      logger.info('MQTT connected');
      this.mqttClient?.subscribe(subtopic, (err: Error | null) => {
        if (err) logger.error('Subscribe error:', err);
      });
    });

    this.mqttClient.on('message', async (topic: string, message: Buffer) => {
      try {
        const payload = JSON.parse(message.toString());
        const { uuid, data } = payload;

        if (!uuid || !Array.isArray(data) || data.length === 0) {
          logger.warn('Invalid payload format');
          return;
        }

        const latestData = data[data.length - 1]; // ambil data terakhir

        // Ambil id_mesin dari tabel devices berdasarkan UUID
        const device = await db('devices').select('id_mesin').where('id_mesin', uuid).first();
        const id_mesin = device?.id_mesin;

        if (!id_mesin) {
          logger.warn(`Device not found for UUID: ${uuid}`);
          return;
        }

        // Format waktu ke yyyy-mm-dd HH:MM:SS agar Postgres valid
        const dateObj = new Date(latestData.time);
        const timeFormatted = `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2,'0')}-${dateObj.getDate().toString().padStart(2,'0')} ${dateObj.getHours().toString().padStart(2,'0')}:${dateObj.getMinutes().toString().padStart(2,'0')}:${dateObj.getSeconds().toString().padStart(2,'0')}`;

        const toFixed2 = (x: number) => parseFloat(x.toFixed(2));

        // Insert / replace realtime
        await db('sensor_data')
          .insert({

            uuid: id_mesin,
            time: timeFormatted,
            temperature: toFixed2(latestData.Temperature),
            do_: toFixed2(latestData.DO),
            tur: toFixed2(latestData.TUR),
            ct: toFixed2(latestData.CT),
            ph: toFixed2(latestData.PH),
            orp: toFixed2(latestData.ORP),
            bod: toFixed2(latestData.BOD),
            cod: toFixed2(latestData.COD),
            tss: toFixed2(latestData.TSS),
            n: toFixed2(latestData.N),
            no2: toFixed2(latestData.NO2),
            no3_3: toFixed2(latestData['NO3-3']),
            depth: toFixed2(latestData.DEPTH),
            pump_status: latestData.Pump_Status,
            cv_status: latestData.CV_Status,
            read_status: latestData.Read_Status,
          })
          .onConflict('id_mesin')
          .merge();

        logger.info(`------------------- UUID: ${uuid} | TIME: ${latestData.time} | Data updated -------------------`);
      } catch (err) {
        logger.error('Error handling MQTT message:', err);
      }
    });
  }
}

export = MqttHandler;
