import {
  logger,
  mqttLogger,
  db,
  moment,
} from '../utils/util';
import { Pool } from "pg";
import QueryStream from "pg-query-stream";
import { pipeline } from "stream/promises";
import { stringify } from "csv-stringify";
import ExcelJS from "exceljs";
import { Transform } from "stream";




// Versi akhir masih dicoba
// daftar header yang valid untuk export
const exportableHeaders = [
  { header: "ID", key: "id" },
  { header: "ID Stasiun", key: "id_stasiun" },
  { header: "Time", key: "time" },
  { header: "Temperature", key: "temperature" },
  { header: "DO", key: "do_" },
  { header: "TUR", key: "tur" },
  { header: "TDS", key: "ct" },
  { header: "PH", key: "ph" },
  { header: "ORP", key: "orp" },
  { header: "BOD", key: "bod" },
  { header: "COD", key: "cod" },
  { header: "TSS", key: "tss" },
  { header: "Amonia", key: "n" },
  { header: "NO3", key: "no3_3" },
  { header: "NO32", key: "no2" },
  { header: "Depth", key: "depth" },

];

// ================== EXPORT HANDLER ==================
export const handleMqttExport = async (req: any, res: any) => {
  const { startDate, endDate, namaStasiun, format, headers } = req.query;
  const { role_id, user_id } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  // Parse custom headers dari FE
  let selectedHeaders: string[] = [];
  if (headers) {
    try {
      selectedHeaders = JSON.parse(headers);
    } catch (e) {
      return res.status(400).json({ error: "Invalid headers format, must be JSON array" });
    }
  }

  const exportHeaders =
    selectedHeaders.length > 0
      ? exportableHeaders.filter((h) => selectedHeaders.includes(h.key))
      : exportableHeaders; // default semua kolom penting

  try {
    // ================== 🔍 VALIDASI STASIUN ==================
    if (namaStasiun) {
      if (role_id === "usr") {
        // cek apakah stasiun dimiliki user
        const stasiunUser = await db("devices as d")
          .leftJoin("users as u", "u.device_id", "d.id")
          .where("u.id", user_id)
          .andWhere("d.nama_stasiun", "ILIKE", `%${namaStasiun}%`)
          .first();

        if (!stasiunUser) {
          return res
            .status(403)
            .json({ error: `Anda tidak punya akses ke stasiun ${namaStasiun}` });
        }
      } else {
        // admin → cek apakah stasiun ada di database
        const stasiun = await db("devices")
          .where("nama_stasiun", "ILIKE", `%${namaStasiun}%`)
          .first();

        if (!stasiun) {
          return res
            .status(404)
            .json({ error: `Stasiun ${namaStasiun} tidak ditemukan` });
        }
      }
    }
    // base union data dari 2 tabel
    const baseUnion = db
      .select("*")
      .from("mqtt_datas")
      .whereBetween("time", [startDate, endDate])
      .unionAll((qb: any) => {
        qb.select("*")
          .from("mqtt_datas_archive")
          .whereBetween("time", [startDate, endDate]);
      });

    let query = db.from(baseUnion.as("md")).select("md.*");
    query = query.leftJoin({ d: "devices" }, "md.id_stasiun", "d.nama_stasiun");

    // filter role
    if (role_id === "usr") {
      query = query
        .leftJoin({ u: "users" }, "u.device_id", "d.id")
        .where("u.id", user_id)
        .andWhereRaw("md.id_stasiun = d.nama_stasiun");
    }

    // filter stasiun
    if (namaStasiun) {
      query = query.where("d.nama_stasiun", "ILIKE", `%${namaStasiun}%`);
    }

    query = query.orderBy("md.time", "asc");

    const stream = query.stream();

    // ================== CSV ==================
    if (!format || format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="mqtt_data_export.csv"`);

      const csvStream = stringify({
        header: true,
        columns: exportHeaders.reduce(
          (acc, h) => ({ ...acc, [h.key]: h.header }),
          {}
        ),
      });

      mqttLogger.info("CSV streaming started...");
      let rowCount = 0;

      const mappedStream = stream.pipe(
        new (require("stream").Transform)({
          objectMode: true,
          transform(row: { [x: string]: any; time: string | number | Date; }, _enc: any, cb: (arg0: null, arg1: any) => void) {
            const obj: any = {};
            exportHeaders.forEach((h) => {
              if (h.key === "time") {
                obj[h.key] = row.time
                  ? new Date(row.time).toISOString().replace("T", " ").substring(0, 19)
                  : null;
              } else {
                obj[h.key] = row[h.key];
              }
            });
            rowCount++;
            if (rowCount % 10000 === 0) {
              mqttLogger.info(`CSV rows streamed: ${rowCount}`);
            }
            cb(null, obj);
          },
        })
      );

      await pipeline(mappedStream, csvStream, res);
      mqttLogger.info("CSV streaming finished, total rows:", rowCount);
      return;
    }

    // ================== XLSX ==================
    if (format === "xlsx") {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="mqtt_data_export.xlsx"`
      );

      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet("Data");

      worksheet.columns = exportHeaders.map((h) => ({
        header: h.header,
        key: h.key,
        width: 18,
      }));

      mqttLogger.info("XLSX streaming started...");
      let rowCount = 0;

      for await (const row of stream) {
        const rowObj: any = {};
        exportHeaders.forEach((h) => {
          if (h.key === "time") {
            rowObj[h.key] = row.time
              ? new Date(row.time).toISOString().replace("T", " ").substring(0, 19)
              : null;
          } else {
            rowObj[h.key] = row[h.key];
          }
        });
        worksheet.addRow(rowObj).commit();
        rowCount++;
        if (rowCount % 10000 === 0) {
          mqttLogger.info(`XLSX rows streamed: ${rowCount}`);
        }
      }

      await workbook.commit();
      mqttLogger.info("XLSX streaming finished, total rows:", rowCount);
      return;
    }

    return res.status(400).json({ error: "Invalid format. Use csv or xlsx." });
  } catch (error) {
    mqttLogger.error("Export failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export data" });
    }
  }
};

// ================== HEADER LIST HANDLER ==================
export const getMqttExportHeaders = async (_req: any, res: any) => {
  res.json(exportableHeaders);
};
