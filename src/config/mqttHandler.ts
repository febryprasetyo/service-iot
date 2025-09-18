import * as Mqtt from 'mqtt';
import { db, moment, logger } from '../utils/util';
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



/* * back running saat ini */
import PQueue from 'p-queue';
const queue = new PQueue({ concurrency: 5 });

// atau inject kalau sudah ada instance express

type SensorRow = {
  uuid: string;
  time: string;
  temperature?: string;
  do_?: string;
  tur?: string;
  ph?: string;
  bod?: string;
  cod?: string;
  tss?: string;
  depth?: string;
  no3_3?: string;
  n?: string;
  ct?: string;
  no2?: string;
  orp?: string;
  id_stasiun: string;
  is_success: boolean;
};

class MqttHandler {
  public mqttClient!: Mqtt.MqttClient;
  private deviceCache: Map<string, string> = new Map();
  private buffer: Map<string, SensorRow> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  private log(uuid: string, time: string, msg: string, level: "info" | "warn" | "error" | "debug" = "info") {
    const logMsg = `  UUID: ${uuid} | TIME: ${time} | ${msg}  `;
    logger[level](logMsg);
  }

  async initDeviceCache() {
    const devices = await db("devices").select("id_mesin", "nama_stasiun");
    this.deviceCache.clear();
    for (const d of devices) {
      if (d.id_mesin && d.nama_stasiun) {
        this.deviceCache.set(d.id_mesin, d.nama_stasiun);
      }
    }
    logger.info(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | Device cache loaded (${this.deviceCache.size} items)  `);
  }

  startCacheRefresher(intervalMs = 5 * 60 * 1000) {
    setInterval(() => this.initDeviceCache(), intervalMs);
  }

  connect() {
    this.mqttClient = Mqtt.connect(brokerUrl, options);

    this.mqttClient.on("connect", async () => {
      logger.info(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | MQTT connected  `);
      await this.initDeviceCache();
      this.startCacheRefresher();

      this.mqttClient.subscribe(mqttTopic, (err) => {
        if (err) {
          logger.error(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | Failed to subscribe: ${err}  `);
        } else {
          logger.info(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | Subscribed to topic: ${mqttTopic}  `);
        }
      });

      this.startBufferFlusher();
    });

    this.mqttClient.on("error", (err: any) => {
      logger.error(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | MQTT Error: ${err}  `);
      this.mqttClient.end();
    });

    this.mqttClient.on("close", () => {
      logger.warn(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | MQTT disconnected  `);
    });

    this.mqttClient.on("message", (topic, message) => {
      queue.add(() => this.handleMessage(topic, message));
    });
  }

  private startBufferFlusher() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => this.flushAll(), 60 * 1000);
  }

  private async flushAll() {
    const rows = Array.from(this.buffer.values());
    if (rows.length === 0) return;

    logger.info(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | SYNC DATA STARTED  `);
    try {
      await db("mqtt_datas").insert(rows);
      logger.info(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | Flushed ${rows.length} records (last data per UUID)  `);
      logger.info(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | SYNC DATA FINISHED  `);
    } catch (err) {
      logger.error(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | Failed to flush buffer: ${err}  `);
    }

    this.buffer.clear();
  }

  async handleMessage(topic: string, message: Buffer) {
    try {
      const jsonString = JSON.parse(message.toString());
      const uuid = jsonString["uuid"];
      const dataStream = Array.isArray(jsonString["data"]) ? jsonString["data"] : [];

      if (!uuid || dataStream.length === 0) return;

      const namaStasiun = this.deviceCache.get(uuid);
      if (!namaStasiun) {
        this.log(uuid, moment().format("YYYY-MM-DD HH:mm:ss"), "Tidak punya relasi ke id_stasiun, data di-skip", "warn");
        return;
      }

      const el = dataStream[dataStream.length - 1];
      const tm = el["time"]
        ? moment(el["time"], "DD-MM-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
        : moment().format("YYYY-MM-DD HH:mm:ss");

      const row: SensorRow = {
        uuid,
        time: tm,
        temperature: parseFloat(el["Temperature"])?.toFixed(2),
        do_: parseFloat(el["DO"])?.toFixed(2),
        tur: parseFloat(el["TUR"])?.toFixed(2),
        ph: parseFloat(el["PH"])?.toFixed(2),
        bod: parseFloat(el["BOD"])?.toFixed(2),
        cod: parseFloat(el["COD"])?.toFixed(2),
        tss: parseFloat(el["TSS"])?.toFixed(2),
        depth: parseFloat(el["DEPTH"])?.toFixed(2),
        no3_3: parseFloat(el["NO3-3"])?.toFixed(2),
        n: parseFloat(el["N"])?.toFixed(2),
        ct: parseFloat(el["CT"])?.toFixed(2),
        no2: parseFloat(el["NO2"])?.toFixed(2),
        orp: parseFloat(el["ORP"])?.toFixed(2),
        id_stasiun: namaStasiun,
        is_success: false,
      };

      this.buffer.set(uuid, row);
      this.log(uuid, tm, "Updated buffer (last data saved for this minute)", "debug");
    } catch (err) {
      this.log("SYSTEM", moment().format("YYYY-MM-DD HH:mm:ss"), `Failed to parse message: ${err}`, "error");
    }
  }
  
}


export = MqttHandler;
