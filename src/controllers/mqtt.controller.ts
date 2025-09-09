import {
  logger,
  db,
  moment,
} from '../utils/util';
import { Pool } from "pg";
import QueryStream from "pg-query-stream";
import { pipeline } from "stream/promises";
import { stringify } from "csv-stringify";
import ExcelJS from "exceljs";

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
});

const getFileName = (format: string) =>
  `mqtt_export_${moment().format("YYYYMMDD_HHmmss")}.${format}`;

// export async function handleMqttExport(req: any, res: any) {
//   try {
//     const startDate = req.query.startDate
//       ? moment(req.query.startDate).format("YYYY-MM-DD")
//       : null;
//     const endDate = req.query.endDate
//       ? moment(req.query.endDate).format("YYYY-MM-DD")
//       : null;

//     if (!startDate || !endDate) {
//       return res.status(400).json({ error: "startDate and endDate are required" });
//     }

//     const namaStasiun = req.query.namaStasiun || null;
//     const format = (req.query.format as string)?.toLowerCase() || "csv";

//     const startTs = `${startDate} 00:00:00`;
//     const endTs = `${endDate} 23:59:59`;

//     // Base select untuk union
//     const buildBaseSelect = (table: string) => {
//       return db
//         .select(
//           "id",
//           "uuid",
//           db.raw("time as time_ts"),
//           db.raw("to_char(time, 'YYYY-MM-DD HH24:MI:SS') as time"),
//           "temperature",
//           db.raw('do_ as "DO"'),
//           db.raw('tur as "TUR"'),
//           db.raw('ct as "TDS"'),
//           db.raw('ph as "PH"'),
//           db.raw('orp as "ORP"'),
//           db.raw('bod as "BOD"'),
//           db.raw('cod as "COD"'),
//           db.raw('tss as "TSS"'),
//           db.raw('n as "Amonia"'),
//           db.raw('no3_3 as "NO3"'),
//           db.raw('no2 as "NO32"'),
//           db.raw('depth as "Depth"'),
//           "id_stasiun"
//         )
//         .from(table)
//         .whereBetween("time", [startTs, endTs]);
//     };

//     const buildUnionSub = () =>
//       db.from((qb: any) => {
//         qb.unionAll(
//           [buildBaseSelect("mqtt_datas"), buildBaseSelect("mqtt_datas_archive")],
//           true
//         ).as("md");
//       });

//     // Query utama dengan join devices
//     let query = db
//       .select(
//         db.raw(`
//           d.nama_stasiun,
//           md.*
//         `)
//       )
//       .from(buildUnionSub().as("md"))
//       .leftJoin("devices as d", "d.id_mesin", "md.uuid");

//     // Filter user role
//     // if (req.body.role_id !== "adm") {
//     //   query = query
//     //     .leftJoin({ u: "users" }, "u.device_id", "d.id")
//     //     .where("u.id", req.body.user_id)
//     //     .andWhereRaw("md.id_stasiun = d.nama_stasiun"); // hanya stasiun user
//     // }

//     // Filter by nama_stasiun (opsional)
//     if (namaStasiun) {
//       query = query.where("d.nama_stasiun", "ILIKE", `%${namaStasiun}%`);
//     }

//     // Jika format CSV
//     if (format === "csv") {
//       res.setHeader("Content-Type", "text/csv");
//       res.setHeader("Content-Disposition", `attachment; filename=mqtt_export_${startDate}_to_${endDate}.csv`);

//       console.info("CSV streaming started...");

//       const queryStream = query.stream();
//       const csvStream = stringify({ header: true });

//       let rowCount = 0;

//       csvStream.on("data", () => {
//         rowCount++;
//         if (rowCount % 10000 === 0) console.info(`CSV rows streamed: ${rowCount}`);
//       });

//       try {
//         await pipeline(queryStream, csvStream, res);
//         console.info(`CSV streaming finished, total rows: ${rowCount}`);
//       } catch (err: any) {
//         console.error("CSV pipeline failed:", err);
//         if (!res.headersSent) res.status(500).json({ error: "CSV export failed" });
//       }
//     } else if (format === "xlsx") {
//       // XLSX
//       res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//       res.setHeader("Content-Disposition", `attachment; filename=mqtt_export_${startDate}_to_${endDate}.xlsx`);

//       console.info("XLSX streaming started...");
//       const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
//       const sheet = workbook.addWorksheet("mqtt_data");

//       // Header
//       sheet.addRow([
//         "id", "uuid", "time", "temperature", "DO", "TUR", "TDS", "PH", "ORP",
//         "BOD", "COD", "TSS", "Amonia", "NO3", "NO32", "Depth", "id_stasiun", "nama_stasiun"
//       ]).commit();

//       const stream = query.stream();
//       let rowCount = 0;
//       stream.on("data", (row: any) => {
//         sheet.addRow([
//           row.id,
//           row.uuid,
//           row.time,
//           row.temperature,
//           row.DO,
//           row.TUR,
//           row.TDS,
//           row.PH,
//           row.ORP,
//           row.BOD,
//           row.COD,
//           row.TSS,
//           row.Amonia,
//           row.NO3,
//           row.NO32,
//           row.Depth,
//           row.id_stasiun,
//           row.nama_stasiun
//         ]).commit();
//         rowCount++;
//         if (rowCount % 10000 === 0) console.info(`XLSX rows streamed: ${rowCount}`);
//       });

//       stream.on("end", async () => {
//         await workbook.commit();
//         console.info(`XLSX streaming finished, total rows: ${rowCount}`);
//       });

//       stream.on("error", (err: any) => {
//         console.error("XLSX stream error:", err);
//         if (!res.headersSent) res.status(500).json({ error: "XLSX export failed" });
//       });
//     } else {
//       return res.status(400).json({ error: "Invalid format, only 'csv' or 'xlsx' allowed" });
//     }
//   } catch (error: any) {
//     console.error("Export failed:", error);
//     if (!res.headersSent) res.status(500).json({ error: "Export process failed" });
//   }
// }

// Berjalan normal
// export const handleMqttExport = async (req: any, res: any) => {
//   const { startDate, endDate } = req.query;

//   if (!startDate || !endDate) {
//     return res.status(400).json({ error: "startDate and endDate are required" });
//   }

//   try {
//     res.setHeader("Content-Type", "text/csv");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="mqtt_data_export.csv"`
//     );

//     // gabungkan query dari kedua tabel
//     const query = db("mqtt_datas")
//       .select("*")
//       .whereBetween("time", [startDate, endDate])
//       .unionAll((qb: any) => {
//         qb.select("*")
//           .from("mqtt_datas_archive")
//           .whereBetween("time", [startDate, endDate]);
//       })
//       .orderBy("time", "asc");

//     // stream hasil query
//     const queryStream = query.stream();
//     const csvStream = stringify({ header: true });

//     try {
//       await pipeline(queryStream, csvStream, res);
//     } catch (err) {
//       console.error("Pipeline failed:", err);
//       if (!res.headersSent) {
//         res.status(500).json({ error: "Export failed" });
//       }
//     }
//   } catch (error) {
//     console.error("Export failed:", error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "Failed to export data" });
//     }
//   }
// };


// Baru, dicoba filter nama stasiun dan role user semua berjalan
// export const handleMqttExport = async (req: any, res: any) => {
//   const { startDate, endDate, namaStasiun } = req.query;
//   const { role_id, user_id } = req.body;

//   if (!startDate || !endDate) {
//     return res
//       .status(400)
//       .json({ error: "startDate and endDate are required" });
//   }

//   try {
//     res.setHeader("Content-Type", "text/csv");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="mqtt_data_export.csv"`
//     );

//     // Subquery: union mqtt_datas + archive
//     const baseUnion = db
//       .select("*")
//       .from("mqtt_datas")
//       .whereBetween("time", [startDate, endDate])
//       .unionAll((qb: any) => {
//         qb.select("*")
//           .from("mqtt_datas_archive")
//           .whereBetween("time", [startDate, endDate]);
//       });

//     // Bungkus union jadi subquery md
//     let query = db.from(baseUnion.as("md")).select("md.*");

//     // Join ke devices
//     query = query.leftJoin({ d: "devices" }, "md.id_stasiun", "d.nama_stasiun");

//     // Filter role
//     if (role_id !== "adm") {
//       query = query
//         .leftJoin({ u: "users" }, "u.device_id", "d.id")
//         .where("u.id", user_id)
//         .andWhereRaw("md.id_stasiun = d.nama_stasiun");
//     }

//     // Filter nama stasiun
//     if (namaStasiun) {
//       query = query.where("d.nama_stasiun", "ILIKE", `%${namaStasiun}%`);
//     }

//     query = query.orderBy("md.time", "asc");

//     // Stream hasil query
//     const queryStream = query.stream();
//     const csvStream = stringify({ header: true });

//     console.log("CSV streaming started...");
//     let rowCount = 0;

//     queryStream.on("data", () => {
//       rowCount++;
//       if (rowCount % 10000 === 0) {
//         console.log(`CSV rows streamed: ${rowCount}`);
//       }
//     });

//     queryStream.on("end", () => {
//       console.log("CSV streaming finished, total rows:", rowCount);
//     });

//     await pipeline(queryStream, csvStream, res);
//   } catch (error) {
//     console.error("Export failed:", error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "Failed to export data" });
//     }
//   }
// };

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
      if (role_id !== "adm") {
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
    if (role_id !== "adm") {
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

      console.log("CSV streaming started...");
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
              console.log(`CSV rows streamed: ${rowCount}`);
            }
            cb(null, obj);
          },
        })
      );

      await pipeline(mappedStream, csvStream, res);
      console.log("CSV streaming finished, total rows:", rowCount);
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

      console.log("XLSX streaming started...");
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
          console.log(`XLSX rows streamed: ${rowCount}`);
        }
      }

      await workbook.commit();
      console.log("XLSX streaming finished, total rows:", rowCount);
      return;
    }

    return res.status(400).json({ error: "Invalid format. Use csv or xlsx." });
  } catch (error) {
    console.error("Export failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export data" });
    }
  }
};

// ================== HEADER LIST HANDLER ==================
export const getMqttExportHeaders = async (_req: any, res: any) => {
  res.json(exportableHeaders);
};