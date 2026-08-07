import { CalibrationRepository } from '../repositories/CalibrationRepository';
import { CreateCalibrationPayload } from '../types/calibration.types';

export class CalibrationService {
  private repository: CalibrationRepository;

  constructor(repository: CalibrationRepository) {
    this.repository = repository;
  }

  /**
   * Initializes a draft calibration process.
   * Maps HTTP payload and auth context (officerId) into the database structure.
   */
  async createCalibrationDraft(payload: CreateCalibrationPayload, officerId: number): Promise<string> {
    const { parameter_ids, ...headerData } = payload;
    
    // Default draft status and attach officer ID
    const dbPayload = {
      ...headerData,
      officer_id: officerId,
      status: 'draft' as const,
    };

    return this.repository.createDraft(dbPayload, parameter_ids);
  }
}
