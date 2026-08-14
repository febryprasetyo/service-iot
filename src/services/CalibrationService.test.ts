import { CalibrationService } from './CalibrationService';
import { CalibrationRepository } from '../repositories/CalibrationRepository';
import { CreateCalibrationPayload } from '../types/calibration.types';

describe('CalibrationService', () => {
  let service: CalibrationService;
  let mockRepository: jest.Mocked<CalibrationRepository>;

  beforeEach(() => {
    mockRepository = {
      createDraft: jest.fn(),
    } as any;
    service = new CalibrationService(mockRepository);
  });

  describe('createCalibrationDraft', () => {
    it('should generate verification UUID and pass officer ID to repository', async () => {
      const officerId = 99;
      const payload: CreateCalibrationPayload = {
        station_id: 1,
        calibration_start_date: '2026-08-07',
        calibration_end_date: '2026-08-08',
        parameter_ids: [1, 2],
      };

      mockRepository.createDraft.mockResolvedValue('new-uuid-123');

      const result = await service.createCalibrationDraft(payload, officerId);

      expect(result).toBe('new-uuid-123');
      expect(mockRepository.createDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          station_id: 1,
          officer_id: 99,
          status: 'draft',
        }),
        [1, 2]
      );
    });
  });
});
