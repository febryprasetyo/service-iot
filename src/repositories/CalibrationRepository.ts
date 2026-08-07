import { Knex } from 'knex';
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
      // 1. Insert header
      const [insertedHeader] = await trx('calibrations')
        .insert({
          ...headerPayload,
          // uuid and timestamps are handled by default/knex
        })
        .returning('id');
      
      const calibrationId = insertedHeader.id;

      // 2. Insert empty details for each selected parameter
      if (parameterIds && parameterIds.length > 0) {
        const detailsData = parameterIds.map((paramId) => ({
          calibration_id: calibrationId,
          parameter_id: paramId
        }));

        await trx('calibration_details').insert(detailsData);
      }

      return calibrationId;
    });
  }
}
