import { CalibrationRepository } from './CalibrationRepository';

describe('CalibrationRepository', () => {
  const mockDb = {
    transaction: jest.fn(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
  };

  let repository: CalibrationRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new CalibrationRepository(mockDb as any);
  });

  describe('createDraft', () => {
    it('should create a calibration header with next sequence based on raw max query', async () => {
      const mockTrx = jest.fn().mockImplementation(() => mockTrx) as any;
      mockTrx.raw = jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('MAX(')) {
          return Promise.resolve({ rows: [{ max_seq: 11 }] });
        }
        return Promise.resolve({ rows: [] });
      });
      mockTrx.insert = jest.fn().mockReturnValue(mockTrx);
      mockTrx.returning = jest.fn().mockResolvedValue([{ id: 'mock-uuid-123' }]);
      mockTrx.join = jest.fn().mockReturnValue(mockTrx);
      mockTrx.select = jest.fn().mockReturnValue(mockTrx);
      mockTrx.where = jest.fn().mockResolvedValue([]);

      mockDb.transaction.mockImplementationOnce(async (cb) => {
        return cb(mockTrx);
      });

      const payload = {
        station_id: 1,
        calibration_start_date: '2026-08-07',
        calibration_end_date: '2026-08-08',
        officer_id: 2,
        status: 'draft' as const,
      };

      const result = await repository.createDraft(payload, [1, 2, 3]);

      expect(result).toBe('mock-uuid-123');
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockTrx.raw).toHaveBeenCalledWith(
        expect.stringContaining('pg_advisory_xact_lock'),
        expect.any(Array)
      );
      expect(mockTrx.raw).toHaveBeenCalledWith(
        expect.stringContaining('MAX('),
        expect.any(Array)
      );
      expect(mockTrx.insert).toHaveBeenCalledWith(expect.objectContaining({
        station_id: 1,
        status: 'draft',
        report_no: expect.stringMatching(/CR-\d{4}\/[IVXLCDM]+\/OMS-CMC\/012$/)
      }));
    });

    it('should fallback to parsing report_no list when raw query is not available or throws', async () => {
      const mockTrx = jest.fn().mockImplementation(() => mockTrx) as any;
      mockTrx.raw = jest.fn().mockRejectedValue(new Error('raw not supported'));
      mockTrx.whereRaw = jest.fn().mockReturnValue(mockTrx);
      mockTrx.select = jest.fn().mockResolvedValue([
        { report_no: 'CR-2026/VIII/OMS-CMC/003' },
        { report_no: 'CR-2026/VIII/OMS-CMC/007' }
      ]);
      mockTrx.insert = jest.fn().mockReturnValue(mockTrx);
      mockTrx.returning = jest.fn().mockResolvedValue([{ id: 'mock-uuid-456' }]);
      mockTrx.join = jest.fn().mockReturnValue(mockTrx);
      mockTrx.where = jest.fn().mockResolvedValue([]);

      mockDb.transaction.mockImplementationOnce(async (cb) => {
        return cb(mockTrx);
      });

      const payload = {
        station_id: 2,
        calibration_start_date: '2026-08-10',
        calibration_end_date: '2026-08-11',
        officer_id: 5,
        status: 'draft' as const,
      };

      const result = await repository.createDraft(payload, []);

      expect(result).toBe('mock-uuid-456');
      expect(mockTrx.insert).toHaveBeenCalledWith(expect.objectContaining({
        station_id: 2,
        status: 'draft',
        report_no: expect.stringMatching(/CR-\d{4}\/[IVXLCDM]+\/OMS-CMC\/008$/)
      }));
    });
  });
});
