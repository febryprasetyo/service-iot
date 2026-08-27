import { Knex } from 'knex';
import { ensureDefaultSolutionStandardsForDetail } from '../helpers/CalibrationDefaults';
import { CreateCalibrationPayload } from '../types/calibration.types';

export class CalibrationRepository {
  private db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  /**
   * Creates a new Calibration Draft.
   * Inserts into `calibrations` table and creates empty `calibration_details`
   * for the given parameter IDs within a transaction.
   * 
   * @param headerPayload The data for the `calibrations` table.
   * @param parameterIds An array of parameter IDs to generate details for.
   * @returns The UUID of the newly created calibration header.
   */
  async createDraft(headerPayload: Omit<CreateCalibrationPayload, 'parameter_ids'> & { officer_id: number; status: 'draft' }, parameterIds: number[]): Promise<string> {
    return this.db.transaction(async (trx) => {
      // 1. Auto-generate report_no in format CR-YYYY/ROMAN/OMS-CMC/NNN
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const romanMonth = romanMonths[month - 1];
      const prefix = `CR-${year}/`;

      let maxSeq = 0;
      let calculated = false;

      // In PostgreSQL, serialize sequence generation using transaction-level advisory lock
      // and extract the maximum existing numeric suffix for the current year
      if (typeof trx.raw === 'function') {
        try {
          await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [`calibration_report_no_${year}`]);
          const maxSeqResult = await trx.raw(
            `SELECT COALESCE(MAX(SUBSTRING(report_no FROM '([0-9]+)$')::integer), 0) AS max_seq
             FROM calibrations
             WHERE report_no LIKE ?`,
            [`${prefix}%`]
          );
          const rawVal = maxSeqResult?.rows?.[0]?.max_seq ?? (Array.isArray(maxSeqResult) ? maxSeqResult[0]?.max_seq : maxSeqResult?.max_seq);
          if (rawVal !== undefined) {
            maxSeq = Number(rawVal) || 0;
            calculated = true;
          }
        } catch {
          // Fallback if raw or advisory lock is unsupported (e.g. mock DB in tests)
        }
      }

      // Fallback for mock environments or alternative dialects
      if (!calculated) {
        const rows = await trx('calibrations')
          .whereRaw(`report_no LIKE ?`, [`${prefix}%`])
          .select('report_no');
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const match = row?.report_no ? String(row.report_no).match(/(\d+)$/) : null;
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxSeq) {
                maxSeq = num;
              }
            }
          }
        }
      }

      const seq = String(maxSeq + 1).padStart(3, '0');
      const report_no = `CR-${year}/${romanMonth}/OMS-CMC/${seq}`;

      // 2. Insert header
      const [insertedHeader] = await trx('calibrations')
        .insert({
          ...headerPayload,
          report_no,
          // uuid and timestamps are handled by default/knex
        })
        .returning('id');
      
      // Knex 0.95 returns raw scalars from .returning(); Knex v1+ returns objects
      const calibrationId = (insertedHeader && typeof insertedHeader === 'object') ? insertedHeader.id : insertedHeader;

      // 3. Insert empty details for each selected parameter
      if (parameterIds && parameterIds.length > 0) {
        const detailsData = parameterIds.map((paramId) => ({
          calibration_id: calibrationId,
          parameter_id: paramId
        }));

        await trx('calibration_details').insert(detailsData);

        const insertedDetails = await trx('calibration_details')
          .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
          .select('calibration_details.id as detail_id', 'master_parameters.name as parameter_name')
          .where('calibration_details.calibration_id', calibrationId);

        for (const detail of insertedDetails) {
          await ensureDefaultSolutionStandardsForDetail(trx, detail.detail_id, detail.parameter_name);
        }
      }

      return calibrationId;
    });
  }
}
