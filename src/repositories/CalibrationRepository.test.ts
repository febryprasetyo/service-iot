import { CalibrationRepository } from './CalibrationRepository';
// Assuming we have a configured Knex instance to import
// import db from '../config/database'; 

describe('CalibrationRepository', () => {
  // Mocking the database dependency
  const mockDb = {
    transaction: jest.fn(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
  };

  let repository: CalibrationRepository;

  beforeEach(() => {
    repository = new CalibrationRepository(mockDb as any);
  });

  describe('createDraft', () => {
    it('should create a calibration header and return the created UUID', async () => {
      // Mocking transaction
      const mockTrx = jest.fn().mockImplementation(() => mockTrx) as any;
      mockTrx.insert = jest.fn().mockReturnValue(mockTrx);
      mockTrx.returning = jest.fn().mockResolvedValue([{ id: 'mock-uuid-123' }]);
      
      mockDb.transaction.mockImplementationOnce(async (cb) => {
        return cb(mockTrx);
      });

      const payload = {
        station_id: 1,
        calibration_date: '2026-08-07',
        contact_person: 'John Doe',
        phone: '0812345678',
        officer_id: 2,
        status: 'draft' as const,
      };

      const result = await repository.createDraft(payload, [1, 2, 3]);

      expect(result).toBe('mock-uuid-123');
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockTrx.insert).toHaveBeenCalledWith(expect.objectContaining({
        station_id: 1,
        status: 'draft'
      }));
    });
  });
});
