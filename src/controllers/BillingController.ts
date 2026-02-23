import {
  db,
  logger,
  sendResponseCustom,
  sendResponseError,
  createError,
  validateParamsAll,
  errorCodes,
  moment
} from '../utils/util';

class BillingController {
  /**
   * API Handle Billing Summary
   * @param {*} req
   */
  async handleSummary(req: any, res: any) {
    try {
      const station = req.query.station;

      let queryPaket = db('paket_data').select(
        db.raw('SUM(harga) as total_bill'),
        db.raw("SUM(CASE WHEN billing_status = 'unbilled' THEN harga ELSE 0 END) as total_unbilled"),
        db.raw("SUM(CASE WHEN reimbursement_status = 'reimbursed' THEN harga ELSE 0 END) as total_reimbursed")
      );

      let queryToken = db('token_listrik').select(
        db.raw('SUM(harga) as total_bill'),
        db.raw("SUM(CASE WHEN billing_status = 'unbilled' THEN harga ELSE 0 END) as total_unbilled"),
        db.raw("SUM(CASE WHEN reimbursement_status = 'reimbursed' THEN harga ELSE 0 END) as total_reimbursed")
      );

      if (station) {
        queryPaket = queryPaket.where({ station });
        queryToken = queryToken.where({ station });
      }

      const [summaryPaket, summaryToken] = await Promise.all([
        queryPaket.first(),
        queryToken.first()
      ]);

      const totalBill = (Number(summaryPaket?.total_bill) || 0) + (Number(summaryToken?.total_bill) || 0);
      const totalUnbilled = (Number(summaryPaket?.total_unbilled) || 0) + (Number(summaryToken?.total_unbilled) || 0);
      const totalReimbursed = (Number(summaryPaket?.total_reimbursed) || 0) + (Number(summaryToken?.total_reimbursed) || 0);

      return sendResponseCustom(res, {
        success: true,
        data: {
          total_bill: totalBill,
          total_unbilled: totalUnbilled,
          total_reimbursed: totalReimbursed,
          total_pending_reimbursement: totalBill - totalReimbursed
        }
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);
      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Update Billing/Reimbursement Status
   * @param {*} req
   */
  async handleUpdateStatus(req: any, res: any) {
    try {
      const { type, id, billing_status, reimbursement_status } = req.body;

      let rules = {
        type: 'required|in:paket,token',
        id: 'required|number',
      };

      await validateParamsAll(req.body, rules).catch((err) => {
        delete err.failed;
        throw createError('', 'E_BAD_REQUEST', err);
      });

      const tableName = type === 'paket' ? 'paket_data' : 'token_listrik';
      const updateData: any = { updated_at: new Date() };

      if (billing_status) updateData.billing_status = billing_status;
      if (reimbursement_status) updateData.reimbursement_status = reimbursement_status;

      const updated = await db(tableName).where({ id }).update(updateData);

      if (updated === 0) {
        throw createError('Data tidak ditemukan', 'E_BAD_REQUEST');
      }

      return sendResponseCustom(res, {
        success: true,
        message: 'Status tagihan berhasil diperbarui'
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);
      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Billing History (3-month periods)
   * @param {*} req
   */
  async handleHistory(req: any, res: any) {
    try {
      const station = req.query.station;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      // Calculate the start of the current 3-month period
      // For simplicity, let's say we group by calendar quarters or just last 90 days.
      // User asked for "dalam periode 3 bulan sekali", which implies grouping/filtering by 3-month buckets.

      const queryPaket = db('paket_data')
        .select(
          'id',
          'tanggal',
          'nama_paket as nama',
          'harga',
          'pic',
          'station',
          'billing_status',
          'reimbursement_status',
          'created_at',
          db.raw("'paket' as type")
        )
        .whereRaw("tanggal >= CURRENT_DATE - INTERVAL '3 months'");

      const queryToken = db('token_listrik')
        .select(
          'id',
          'tanggal',
          'nama',
          'harga',
          'pic',
          'station',
          'billing_status',
          'reimbursement_status',
          'created_at',
          db.raw("'token' as type")
        )
        .whereRaw("tanggal >= CURRENT_DATE - INTERVAL '3 months'");

      if (station) {
        queryPaket.where({ station });
        queryToken.where({ station });
      }

      const historyQuery = db.select('*')
        .from(queryPaket.unionAll(queryToken).as('combined'))
        .orderBy('tanggal', 'desc')
        .limit(limit)
        .offset(offset);

      const countQuery = db.from(queryPaket.unionAll(queryToken).as('combined')).count('* as total');

      const [data, [{ total }]] = await Promise.all([
        historyQuery,
        countQuery.first() as any
      ]);

      return sendResponseCustom(res, {
        success: true,
        data,
        pagination: {
          total: parseInt(total),
          limit,
          offset
        }
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);
      return sendResponseError(res, error);
    }
  }
}

export = BillingController;
