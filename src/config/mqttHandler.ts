import * as Mqtt from 'mqtt';
import { db, moment, logger, mqttLogger, nowWib } from '../utils/util';
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

type MonitoringRow = Omit<SensorRow, 'is_success'> & {
  pump_status?: string | number | null;
  cv_status?: string | number | null;
  read_status?: string | number | null;
};


class MqttHandler {
  public mqttClient!: Mqtt.MqttClient;
  private deviceCache: Map<string, string> = new Map();
  private bufferMqtt: SensorRow[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private log(uuid: string, time: string, msg: string, level: "info" | "warn" | "error" | "debug" = "info") {
    const logMsg = `  UUID: ${uuid} | TIME: ${time} | ${msg}  `;
    mqttLogger[level](logMsg);
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
      mqttLogger.info(`  UUID: SYSTEM | TIME: ${nowWib()} | Device cache loaded (${this.deviceCache.size} items)  `);
    } catch (error) {
      mqttLogger.error(`  UUID: SYSTEM | TIME: ${nowWib()} | Failed to load device cache: ${error}  `);
    }
  }

  startCacheRefresher(intervalMs = 5 * 60 * 1000) {
    setInterval(() => this.initDeviceCache(), intervalMs);
  }

  connect() {
    this.mqttClient = Mqtt.connect(brokerUrl, options);

    this.mqttClient.on("connect", async () => {
      mqttLogger.info(`  UUID: SYSTEM | TIME: ${nowWib()} | MQTT connected to ${brokerUrl} `);
      await this.initDeviceCache();
      this.startCacheRefresher();

      this.mqttClient.subscribe(mqttTopic, (err) => {
        if (err) {
          mqttLogger.error(`  UUID: SYSTEM | TIME: ${nowWib()} | Failed to subscribe: ${err}  `);
        } else {
          mqttLogger.info(`  UUID: SYSTEM | TIME: ${nowWib()} | Subscribed to topic: ${mqttTopic}  `);
        }
      });

      this.startBufferFlusher();
    });

    this.mqttClient.on("error", (err: any) => {
      mqttLogger.error(`  UUID: SYSTEM | TIME: ${nowWib()} | MQTT Error: ${err}  `);
      this.mqttClient.end();
    });

    this.mqttClient.on("close", () => {
      mqttLogger.warn(`  UUID: SYSTEM | TIME: ${nowWib()} | MQTT disconnected  `);
    });

    this.mqttClient.on("message", (topic, message) => {
      queue.add(() => this.handleMessage(topic, message));
    });
  }

  private startBufferFlusher() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => this.saveMqttData(), 60 * 1000);
  }

  async saveMqttData() {
    if (this.bufferMqtt.length === 0) {
      return;
    }

    try {
      await db.raw('SELECT 1'); // Check DB connection
    } catch (dbError) {
      mqttLogger.error('Database connection lost. Skipping flush to preserve buffer.', dbError);
      return;
    }

    const dataToInsert = [...this.bufferMqtt];
    this.bufferMqtt = []; // Clear buffer immediately

    mqttLogger.info(`  UUID: SYSTEM | TIME: ${nowWib()} | Flushing ${dataToInsert.length} records...`);

    // Sanitize and Timestamp
    const finalData = dataToInsert.map(row => {
      const { is_success, ...cleanRow } = row; // Remove is_success if it exists
      return {
        ...cleanRow,
        created_at: nowWib() // Force server time (WIB)
      };
    });

    const BATCH_SIZE = 500;

    for (let i = 0; i < finalData.length; i += BATCH_SIZE) {
      const chunk = finalData.slice(i, i + BATCH_SIZE);

      try {
        await db('mqtt_datas').insert(chunk);

        mqttLogger.info(`  UUID: SYSTEM | TIME: ${nowWib()} | Saved chunk ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} records)`);
      } catch (error: any) {
        mqttLogger.error(`  UUID: SYSTEM | TIME: ${nowWib()} | Error saving chunk: ${error}`);
        // Consider re-queueing failed chunks or logging explicitly
      }
    }
  }




  async handleMessage(topic: string, message: Buffer) {
    try {
      const jsonString = JSON.parse(message.toString());
      const uuid = jsonString["uuid"];
      const dataStream = Array.isArray(jsonString["data"]) ? jsonString["data"] : [];

      if (!uuid || dataStream.length === 0) return;

      const namaStasiun = this.deviceCache.get(uuid) ?? 'UNKNOWN';

      const el = dataStream[dataStream.length - 1];
      // Keep device time as-is (device sends time in WIB format)
      const tm = el["time"]
        ? moment(el["time"], "DD-MM-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
        : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

      // ====== VALIDASI STATUS ======
      // Nilai default jika tidak ada Read_Status (anggap aktif)
      let readStatus = typeof el["Read_Status"] === "undefined" || el["Read_Status"] === null
        ? 1
        : parseInt(el["Read_Status"]);
      // Logika baru: Jika Read_Status == 0, tetap update monitoring (realtime), tapi JANGAN simpan history/sensor_data

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

      // ✅ Simpan ke mqtt_monitoring (selalu, meskipun Read_Status=0)
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

      // Status tracking for log
      let sensorDataStatus = "SKIPPED";
      let historyStatus = "SKIPPED";

      // Hanya simpan ke sensor_data dan history jika Read_Status != 0

      // ✅ Simpan ke sensor_data (1 data per uuid)
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
        sensorDataStatus = "OK";
      } catch (err) {
        sensorDataStatus = "FAIL";
        // Silent fail on sensor_data as requested by user - treated as normal behavior
      }

      // ✅ Simpan ke mqtt_datas (Buffer History) hanya jika punya relasi
      if (namaStasiun && namaStasiun !== 'UNKNOWN') {
        this.bufferMqtt.push(baseRow);
        historyStatus = "BUFFERED";
      } else {
        historyStatus = "NO_RELATION";
      }

      // Consolidated Log
      this.log(uuid, tm, `Processed: [Realtime: OK] [Sensor: ${sensorDataStatus}] [History: ${historyStatus}]`, "debug");

    } catch (err) {
      this.log("SYSTEM", nowWib(), `Failed to parse message: ${err}`, "error");
    }
  }

}


export = MqttHandler;
