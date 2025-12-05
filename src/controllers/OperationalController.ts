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


class OperationController {
    // Handler Pulsa
    async handlerPulsaCreate(req: any, res:any) {
        try {
            const { tanggal, nama_paket, masa_aktif, harga, station } = req.body;
            const pic = req.user?.username;

            let rules = {
                tanggal: 'required|string',
                nama_paket: 'required|string',
                harga: 'required|string',
                station: 'required|string'
            };
            await validateParamsAll({ tanggal, nama_paket, harga, station }, rules).catch((err) => {
                delete err.failed;
                throw createError('', 'E_BAD_REQUEST', err);
            });

            const [id] = await db('paket_data').insert({ tanggal, nama_paket, masa_aktif, harga, pic, station }).returning('id');
            return sendResponseCustom(res, {
                success: true,
                message: `Pengajuan untuk stasiun ${station} oleh ${pic} berhasil dibuat.`
            });
        } catch (error: any) {
            return sendResponseError(res, error);
        }

    }
    async handlerPulsaGetAll(req: any, res:any) {
       const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [rows, [{ count }]] = await Promise.all([
            db('paket_data').select('*').limit(limit).offset(offset),
            db('paket_data').count('*').then((r: [{ count: string; }]) => r as [{ count: string }])
        ]);

        res.json({
            pagination: {
                total: parseInt(count),
                page,
                limit,
                totalPages: Math.ceil(parseInt(count) / limit)
            },
            data: rows
        });

    }
    async handlerPulsaGetById(req: any, res:any) {
        const { id } = req.params;
        const row = await db('paket_data').where({ id }).first();
        row ? res.json(row) : res.status(404).json({ error: 'Not found' });

    }
    async handlerPulsaUpdate(req: any, res:any) {
        const { id } = req.params;
        const { tanggal, nama_paket, masa_aktif, harga, station } = req.body;
        const updated = await db('paket_data')
            .where({ id: req.params.id })
            .update({
                tanggal,
                nama_paket,
                masa_aktif,
                harga,
                station,
                updated_at: db.fn.now()
            });

            if (updated === 0) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
            }
        return sendResponseCustom(res, {
            success: true,
            message: `Pengajuan nomor id ${id} berhasil diperbarui.`
        });

    }
    async handlerPulsaDelete(req: any, res:any) {
        const { id } = req.params;
        await db('paket_data').where({ id}).del();
        return sendResponseCustom(res, {
            success: true,
            message: `Pengajuan nomor id ${id} berhasil dihapus.`
        });
    }

     // Handler Listrik
    async handlerListrikCreate(req: any, res:any) {
        try {
            const { tanggal, nama, kwh, harga, station } = req.body;
            const pic = req.user?.username;

            let rules = {
                tanggal: 'required|string',
                nama: 'required|string',
                harga: 'required|string',
                station: 'required|string'
            };
            await validateParamsAll({ tanggal, nama, harga, station }, rules).catch((err) => {
                delete err.failed;
                throw createError('', 'E_BAD_REQUEST', err);
            });

            const [id] = await db('token_listrik').insert({ tanggal, nama, kwh, harga, pic, station }).returning('id');
            return sendResponseCustom(res, {
                success: true,
                message: `Pengajuan untuk stasiun ${station} oleh ${pic} berhasil dibuat.`
            });
        } catch (error: any) {
            return sendResponseError(res, error);
        }
    }
    async handlerListrikGetAll(req: any, res:any) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [rows, [{ count }]] = await Promise.all([
            db('token_listrik').select('*').limit(limit).offset(offset),
            db('token_listrik').count('*').then((r: [{ count: string; }]) => r as [{ count: string }])
        ]);

        res.json({
            pagination: {
                total: parseInt(count),
                page,
                limit,
                totalPages: Math.ceil(parseInt(count) / limit)
            },
            data: rows
        });


    }
    async handlerListrikGetById(req: any, res:any) {

        const { id } = req.params;
        const row = await db('token_listrik').where({ id }).first();
        row ? res.json(row) : res.status(404).json({ error: 'Not found' });
    }
    async handlerListrikUpdate(req: any, res:any) {
        const { id } = req.params;
        const { tanggal, nama, kwh, harga, station } = req.body;
        const updated = await db('token_listrik')
            .where({ id: req.params.id })
            .update({
                tanggal,
                nama,
                kwh,
                harga,
                station,
                updated_at: db.fn.now()
            });

            if (updated === 0) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
            }
        return sendResponseCustom(res, {
            success: true,
            message: `Pengajuan nomor id ${id} berhasil diperbarui.`
        });
    }
    async handlerListrikDelete(req: any, res:any) {
        const { id } = req.params;
        await db('token_listrik').where({ id}).del();
        return sendResponseCustom(res, {
            success: true,
            message: `Pengajuan nomor id ${id} berhasil dihapus.`
        });
    }
}

export = OperationController;
