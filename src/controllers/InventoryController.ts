import { Request, Response } from 'express';
import {
    createError,
  db,
  errorCodes,
  logger,
  sendResponseCustom,
  sendResponseError,
  validateParamsAll, moment
} from '../utils/util';
import { time } from 'console';

function parseDateField(dateStr: string, fieldName: string) {
  if (!dateStr) return null;

  const parsed = moment(dateStr, 'DD-MM-YYYY', true); // strict parsing
  if (!parsed.isValid()) {
    throw createError(`${fieldName} not a valid date;`, 'E_BAD_REQUEST');
  }

  return parsed.format('YYYY-MM-DD'); // format ke ISO
}



class InventoryController   {
  // === INVENTORY STOK CREATE ===
  async handleCreateSensorStock(req: any, res: any) {
  try {
    let reqBody = req.body;

    let rules = {
      products: 'required',
      serial_number: 'required',
      date_in: 'required|date',
      date_out: 'date' // optional, tapi harus format tanggal jika ada
    };

    // Validasi input
    await validateParamsAll(reqBody, rules).catch((err) => {
      delete err.failed;
      throw createError('', 'E_BAD_REQUEST', err);
    });

    // Cek apakah serial_number sudah ada
    let existing = await db
      .select(db.raw(`*`))
      .from('sensor_stock')
      .whereRaw(`serial_number = ?`, [reqBody.serial_number]);

    if (existing.length > 0)
      throw createError(`Serial number ${reqBody.serial_number} already exists`, 'E_BAD_REQUEST');

    // Simpan data
    await db('sensor_stock').insert({
      products: reqBody.products,
      serial_number: reqBody.serial_number,
      condition: reqBody.condition,
      date_in: reqBody.date_in,
      date_out: reqBody.date_out || null,
    });

    return sendResponseCustom(res, {
      success: true,
      message: `Stok sensor dengan SN ${reqBody.serial_number} berhasil disimpan`,
    });
  } catch (error: any) {
    if (!errorCodes[error.code]) logger.error(error);
    return sendResponseError(res, error);
  }
}
  // === INVENTORY STOK UPDATE ===
  async handleUpdateSensorStock(req: any, res: any) {
  try {
    const { id } = req.params;
    const reqBody = req.body;

    if (!id) throw createError('ID tidak ditemukan dalam parameter URL', 'E_BAD_REQUEST');

    let rules = {
      products: 'string',
      serial_number: 'string',
      condition: 'string',
      date_in: 'date',
      date_out: 'date',
    };

    await validateParamsAll(reqBody, rules).catch((err) => {
      delete err.failed;
      throw createError('', 'E_BAD_REQUEST', err);
    });

    const existing = await db('sensor_stock').where({ id }).first();
    if (!existing) throw createError(`Sensor stock dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    // Gunakan moment untuk parsing tanggal
    const moment = require('moment');
    const date_in = reqBody.date_in ? moment(reqBody.date_in, 'DD-MM-YYYY', true).format('YYYY-MM-DD') : null;
    const date_out = reqBody.date_out ? moment(reqBody.date_out, 'DD-MM-YYYY', true).format('YYYY-MM-DD') : null;

    await db('sensor_stock').where({ id }).update({
      products: reqBody.products,
      serial_number: reqBody.serial_number,
      condition: reqBody.condition,
      date_in,
      date_out,
    });

    const updated = await db('sensor_stock').where({ id }).first();

    return sendResponseCustom(res, {
      success: true,
      message: `Sensor dengan SN ${existing.serial_number} berhasil diperbarui.`,
      serial_number: updated.serial_number

    });
  } catch (error: any) {
    if (!errorCodes[error.code]) logger.error(error);
    return sendResponseError(res, error);
  }

}

  // === INVENTORY STOK DELETE ===
  async handleDeleteSensorStock(req: any, res: any) {
  try {
    const { id } = req.params;

    if (!id) throw createError('ID tidak ditemukan dalam parameter URL', 'E_BAD_REQUEST');

    const existing = await db('sensor_stock').where({ id }).first();
    if (!existing) throw createError(`Sensor dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    await db('sensor_stock').where({ id }).del();

    return sendResponseCustom(res, {
      success: true,
      message: `Sensor dengan SN ${existing.serial_number} berhasil dihapus.`,
    });
  } catch (error: any) {
    if (!errorCodes[error.code]) logger.error(error);
    return sendResponseError(res, error);
  }

}

  // === INVENTORY STOK LIST ===
  async handleListSensorStock(req: any, res: any) {
    try {
      const { page = 1, limit = 10, sort_by = 'date_in', sort_order = 'desc' } = req.query;

    // Validasi input
    const validSortFields = ['date_in', 'date_out'];
    const validSortOrder = ['asc', 'desc'];

    if (!validSortFields.includes(sort_by)) {
      throw createError(`Invalid sort_by field: ${sort_by}`, 'E_BAD_REQUEST');
    }

    if (!validSortOrder.includes(sort_order)) {
      throw createError(`Invalid sort_order: ${sort_order}`, 'E_BAD_REQUEST');
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Query total count
    const [{ count }] = await db('sensor_stock').count('* as count');

     // Query data dengan pagination dan sorting
    const data = await db('sensor_stock')
      .select('*')
      .orderBy(sort_by, sort_order)
      .limit(Number(limit))
      .offset(offset);

    return sendResponseCustom(res, {
      success: true,
      total: Number(count),
      page: Number(page),
      per_page: Number(limit),
      sort_by,
      sort_order,
      data,
    });
  } catch (error: any) {
    if (!errorCodes[error.code]) logger.error(error);
    return sendResponseError(res, error);
  }

  }

  async handleGetSensorStockById(req: any, res: any) {
  try {
    const { id } = req.params;

    if (!id) throw createError('ID tidak ditemukan dalam parameter URL', 'E_BAD_REQUEST');

    const data = await db('sensor_stock').where({ id }).first();

    if (!data) throw createError(`Sensor stock dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    return sendResponseCustom(res, {
      success: true,
      data,
    });
  } catch (error: any) {
    if (!errorCodes[error.code]) logger.error(error);
    return sendResponseError(res, error);
  }
}

  // === INVENTORY LIST ===
  async handleListInventory(req:any, res:any){
    try {
    const summary = await db('sensor_stock')
      .select('products', 'condition')
      .count('* as total')
      .groupBy('products', 'condition');

    const result: Record<string, Record<string, number>> = {};
    const globalTotal: Record<string, number> = {};

    interface SensorStockSummaryRow {
      products: string;
      condition: string;
      total: number | string;
    }

    (summary as SensorStockSummaryRow[]).forEach((row) => {
      const product = row.products;
      const condition = row.condition.toLowerCase();
      const total = Number(row.total);

      // Per produk
      if (!result[product]) result[product] = {};
      result[product][condition] = total;

      // Total global
      if (!globalTotal[condition]) globalTotal[condition] = 0;
      globalTotal[condition] += total;
    });


    return sendResponseCustom(res, {
      success: true,
      total_condition: globalTotal,
      data: result,
    });
  } catch (error: any) {
    if (!errorCodes[error.code]) logger.error(error);
    return sendResponseError(res, error);
  }

  }
  // === INVENTORY TRACKING CREATE ===
  async handleCreateTracking(req: any, res: any) {
    try {
      const { products, serial_number, nama_stasiun, date_instalation, pic } = req.body;

      await db('sensor_tracking').insert({
        products,
        serial_number,
        nama_stasiun,
        date_instalation,
        pic
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Tracking berhasil dibuat.'
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  // === INVENTORY TRACKING UPDATE ===
  async handleUpdateTracking(req: any, res: any) {
  try {
    const { id } = req.params;
    const { products, serial_number, nama_stasiun, date_instalation, pic } = req.body;

    await db('sensor_tracking').where({ id }).update({
      products,
      serial_number,
      nama_stasiun,
      date_instalation,
      pic
    });

    return sendResponseCustom(res, {
      success: true,
      message: 'Tracking berhasil diperbarui.'
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

  // === INVENTORY TRACKING DELETE ===
async handleDeleteTracking(req: any, res: any) {
  try {
    const { id } = req.params;
    await db('sensor_tracking').where({ id }).del();
    return sendResponseCustom(res, {
      success: true,
      message: 'Tracking berhasil dihapus.'
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

  // === INVENTORY TRACKING LIST ===
  async handleListTracking(req: any, res: any) {
  try {
    const data = await db('sensor_tracking').select('*');
    return sendResponseCustom(res, { success: true, data });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

async handleGetTrackingById(req: any, res: any) {
  try {
    const { id } = req.params;
    const data = await db('sensor_tracking').where({ id }).first();
    if (!data) throw createError('Tracking tidak ditemukan', 'E_NOT_FOUND');
    return sendResponseCustom(res, { success: true, data });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

async handleTrackingDropdownOptions(req: any, res: any) {
  try {
    const { products } = req.query;

    // Ambil semua produk untuk dropdown
    const productRows = await db('sensor_stock').distinct('products');
    const stationRows = await db('stations').distinct('nama_stasiun');

    // Ambil serial number hanya jika produk dipilih
    let serialRows: { serial_number: string }[] = [];
    if (products) {
      serialRows = await db('sensor_stock')
        .where({ products })
        .distinct('serial_number');
    }

    const options = {
      products: productRows.map((p: { products: string }) => p.products),
      serial_number: serialRows.map((s: { serial_number: string }) => s.serial_number),
      nama_stasiun: stationRows.map((s: { nama_stasiun: string }) => s.nama_stasiun)
    };

    return sendResponseCustom(res, {
      success: true,
      options
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}


  // === INVENTORY REQUEST CREATE ===

  async handleRequestCreate(req: any, res: any) {
  try {
    const { products, stations, quantity } = req.body;
    const pic = req.user?.username;

    let rules = {
      products: 'required|string',
      stations: 'required|string',
      quantity: 'required|integer'
    };

    await validateParamsAll({ products, stations, quantity }, rules).catch((err) => {
      delete err.failed;
      throw createError('', 'E_BAD_REQUEST', err);
    });

    const stockItem = await db('sensor_stock').where({ products }).first();
    if (!stockItem) throw createError(`${products} tidak ditemukan di stok`, 'E_NOT_FOUND');

    await db('sensor_request').insert({
      products,
      pic,
      stations,
      quantity,
      status: 'Menunggu Konfirmasi',
      process_stage: 'Menunggu Konfirmasi',
      request_date: moment().format('YYYY-MM-DD')
    });

    return sendResponseCustom(res, {
      success: true,
      message: `Permintaan untuk produk ${products} oleh ${pic} berhasil dibuat.`
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}


  // === INVENTORY REQUEST UPDATE ===
async handleRequestUpdate(req: any, res: any) {
  try {
    const { id } = req.params;
    const { products, stations, quantity, status, process_stage } = req.body;

    let rules = {
      products: 'required|string',
      stations: 'required|string',
      quantity: 'required|integer',
      status: 'string',
      process_stage: 'string'
    };

    await validateParamsAll(req.body, rules).catch((err) => {
      delete err.failed;
      throw createError('', 'E_BAD_REQUEST', err);
    });

    const existing = await db('sensor_request').where({ id }).first();
    if (!existing) throw createError(`Permintaan dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    const stockItem = await db('sensor_stock').where({ products }).first();
    if (!stockItem) throw createError(`${products} tidak ditemukan di stok`, 'E_NOT_FOUND');

    await db('sensor_request').where({ id }).update({
      products,
      stations,
      quantity,
      status,
      process_stage
    });

    return sendResponseCustom(res, {
      success: true,
      message: `Permintaan ID ${id} berhasil diperbarui.`
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

  // === INVENTORY REQUEST DELETE ===
async handleRequestDelete(req: any, res: any) {
  try {
    const { id } = req.params;

    const existing = await db('sensor_request').where({ id }).first();
    if (!existing) throw createError(`Permintaan dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    await db('sensor_request').where({ id }).del();

    return sendResponseCustom(res, {
      success: true,
      message: `Permintaan ID ${id} berhasil dihapus.`
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

  // === INVENTORY REQUEST LIST ===
async handleRequestList(req: any, res: any) {
  try {
    const data = await db('sensor_request').select('*').orderBy('request_date', 'desc');
    return sendResponseCustom(res, { success: true, data });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

async handleRequestApprove(req: any, res: any) {
  try {
    const { id } = req.params;
    const approved_by = req.user?.fullname;

    const existing = await db('sensor_request').where({ id }).first();
    if (!existing) throw createError(`Permintaan dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    await db('sensor_request').where({ id }).update({
      status: 'approved',
      approval_date: moment().format('YYYY-MM-DD'),
      approved_by
    });

    return sendResponseCustom(res, {
      success: true,
      message: `Permintaan ID ${id} telah disetujui oleh ${approved_by}.`
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

async handleRequestReject(req: any, res: any) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const approved_by = req.user?.fullname;

    if (!note) throw createError('Alasan penolakan wajib diisi', 'E_BAD_REQUEST');

    const existing = await db('sensor_request').where({ id }).first();
    if (!existing) throw createError(`Permintaan dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    await db('sensor_request').where({ id }).update({
      status: 'rejected',
      note,
      approval_date: moment().format('YYYY-MM-DD'),
      approved_by
    });

    return sendResponseCustom(res, {
      success: true,
      message: `Permintaan ID ${id} ditolak oleh ${approved_by}.`
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

async handleRequestProcessUpdate(req: any, res: any) {
  try {
    const { id } = req.params;
    const { process_stage } = req.body;

    const validStages = ['persiapan', 'pengajuan', 'pengiriman', 'selesai'];
    if (!validStages.includes(process_stage)) {
      throw createError('Tahapan proses tidak valid', 'E_BAD_REQUEST');
    }

    const existing = await db('sensor_request').where({ id }).first();
    if (!existing) throw createError(`Permintaan dengan ID ${id} tidak ditemukan`, 'E_NOT_FOUND');

    await db('sensor_request').where({ id }).update({ process_stage });

    return sendResponseCustom(res, {
      success: true,
      message: `Tahapan proses untuk ID ${id} diubah menjadi ${process_stage}.`
    });
  } catch (error: any) {
    return sendResponseError(res, error);
  }
}

// END
}

export = InventoryController;