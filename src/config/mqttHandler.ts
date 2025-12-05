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
  pump_status?: number;
  cv_status?: number;
  read_status?: number;
  id_stasiun: string;
  is_success: boolean;
};

type MonitoringRow = Omit<SensorRow, 'is_success'> &{
  pump_status?: string;
  cv_status?: string;
  read_status?: string;
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
    try {
      const devices = await db("devices").select("id_mesin", "nama_stasiun");
      
      this.deviceCache.clear();
      for (const d of devices) {
        if (d.id_mesin) {
          this.deviceCache.set(d.id_mesin, d.nama_stasiun || 'UNKNOWN');
        }
      }
      logger.info(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | Device cache loaded (${this.deviceCache.size} items)  `);
    } catch (error) {
      logger.error(`  UUID: SYSTEM | TIME: ${moment().format("YYYY-MM-DD HH:mm:ss")} | Failed to load device cache: ${error}  `);
    }
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

      const namaStasiun = this.deviceCache.get(uuid) ?? 'UNKNOWN';

      const el = dataStream[dataStream.length - 1];
      const tm = el["time"]
        ? moment(el["time"], "DD-MM-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
        : moment().format("YYYY-MM-DD HH:mm:ss");

      // ====== VALIDASI STATUS ======
    // Nilai default jika tidak ada Read_Status (anggap aktif)
    let readStatus = typeof el["Read_Status"] === "undefined" || el["Read_Status"] === null
      ? 1
      : parseInt(el["Read_Status"]);
    // Abaikan jika Read_Status == 0
    if (readStatus === 0) {
      this.log(uuid, tm, "Read_Status = 0, data diabaikan", "debug");
      return;
    }
    const baseRow: SensorRow = {
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
      is_success: true
    };

    // ✅ Simpan ke mqtt_monitoring (selalu)
    // Tambahan untuk mqtt_monitoring
    const { is_success, ...baseRowWithoutSuccess } = baseRow;

    const monitoringRow: MonitoringRow = {
      ...baseRowWithoutSuccess,
      pump_status: el["Pump_Status"] ?? null,
      cv_status: el["CV_Status"] ?? null,
      read_status: el["Read_Status"] ?? null
    };

    await db("mqtt_monitoring")
      .insert(monitoringRow)
      .onConflict("uuid")
      .merge();

    this.log(uuid, tm, "Updated mqtt_monitoring (realtime)", "debug");

    // ✅ Simpan ke sensor_data (selalu, 1 data per uuid)
    const parseVal = (val: any) => {
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const sensorData = {
      uuid: uuid,
      nama_stasiun: namaStasiun,
      time: tm,
      temperature: parseVal(el["Temperature"]),
      do_: parseVal(el["DO"]),
      tur: parseVal(el["TUR"]),
      ct: parseVal(el["CT"]),
      ph: parseVal(el["PH"]),
      orp: parseVal(el["ORP"]),
      bod: parseVal(el["BOD"]),
      cod: parseVal(el["COD"]),
      tss: parseVal(el["TSS"]),
      n: parseVal(el["N"]),
      no2: parseVal(el["NO2"]),
      no3_3: parseVal(el["NO3-3"]),
      depth: parseVal(el["DEPTH"]),
      pump_status: el["Pump_Status"] == 1,
      cv_status: el["CV_Status"] == 1,
      read_status: el["Read_Status"] == 1,
      id_mesin: uuid
    };

    try {
      await db("sensor_data")
        .insert(sensorData)
        .onConflict("uuid")
        .merge();
      this.log(uuid, tm, "Updated sensor_data", "debug");
    } catch (err) {
      this.log(uuid, tm, `Failed to update sensor_data: ${err}`, "error");
    }

    // ✅ Simpan ke mqtt_datas hanya jika punya relasi
    if (namaStasiun && namaStasiun !== 'UNKNOWN') {
      this.buffer.set(uuid, baseRow);
      this.log(uuid, tm, "Buffered for mqtt_datas (relasi ditemukan)", "debug");
    } else {
      this.log(uuid, tm, "Relasi tidak ditemukan, tidak disimpan ke mqtt_datas", "warn");
    }
    } catch (err) {
      this.log("SYSTEM", moment().format("YYYY-MM-DD HH:mm:ss"), `Failed to parse message: ${err}`, "error");
    }
  }

}


export = MqttHandler;
