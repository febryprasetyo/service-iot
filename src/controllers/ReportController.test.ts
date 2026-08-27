const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockFirst = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCount = jest.fn();
const mockRedisDel = jest.fn();
const mockCreateNotification = jest.fn();

let mockReportsData: any[] = [];
let mockLogsData: any[] = [];
let mockCountResult: any[] = [{ count: '1' }];

function createQueryBuilder(table: string) {
  const qb: any = {
    _table: table,
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockImplementation((...args: any[]) => {
      mockWhere(table, ...args);
      return qb;
    }),
    orderBy: jest.fn().mockImplementation((...args: any[]) => {
      mockOrderBy(table, ...args);
      return qb;
    }),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    modify: jest.fn().mockImplementation((callback: any) => {
      callback(qb);
      return qb;
    }),
    count: jest.fn().mockImplementation((...args: any[]) => {
      mockCount(table, ...args);
      return Promise.resolve(mockCountResult);
    }),
    first: jest.fn().mockImplementation(() => {
      return Promise.resolve(mockFirst(table));
    }),
    insert: jest.fn().mockImplementation((payload: any) => {
      mockInsert(table, payload);
      const res = [{ id: 1, ...payload }];
      return {
        returning: jest.fn().mockResolvedValue(res),
        then: (resolve: any) => Promise.resolve(res).then(resolve),
      };
    }),
    update: jest.fn().mockImplementation((payload: any) => {
      mockUpdate(table, payload);
      return Promise.resolve(1);
    }),
    delete: jest.fn().mockImplementation(() => {
      mockDelete(table);
      return Promise.resolve(1);
    }),
    then: (resolve: any, reject?: any) => {
      const data = table === 'reports' ? mockReportsData : mockLogsData;
      return Promise.resolve(data).then(resolve, reject);
    }
  };
  return qb;
}

const mockDb: any = jest.fn().mockImplementation((table: string) => createQueryBuilder(table));

jest.mock('../config/redis', () => ({
  default: {
    del: mockRedisDel
  }
}));

jest.mock('../utils/notificationService', () => ({
  default: {
    createNotification: mockCreateNotification
  }
}));

jest.mock('../utils/logger', () => ({
  init: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() }),
  getLogger: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() })
}));

jest.mock('../utils/util', () => {
  return {
    logger: { error: jest.fn(), info: jest.fn() },
    sendResponseCustom: jest.fn((res: any, data: any, statusCode = 200) => {
      return res.status(statusCode).json({ success: true, ...data });
    }),
    sendResponseError: jest.fn((res: any, error: any) => {
      const status = error.code === 'E_NOT_FOUND' ? 404 : error.code === 'E_FORBIDDEN' ? 403 : 400;
      return res.status(status).json({ success: false, message: error.message, code: error.code });
    }),
    errorCodes: {
      E_BAD_REQUEST: 400,
      E_NOT_FOUND: 404,
      E_FORBIDDEN: 403,
      E_UNAUTHORIZED: 401,
      E_INTERNAL: 500
    },
    createError: (message: string, code = 'E_BAD_REQUEST', detail: any = null) => {
      const error: any = new Error(message);
      error.code = code;
      error.detail = detail;
      return error;
    },
    nowWib: jest.fn().mockReturnValue('2026-08-27 14:39:30'),
    db: mockDb,
  };
});

import ReportCtl from './ReportController';

function createResponseDouble() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ReportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReportsData = [];
    mockLogsData = [];
    mockCountResult = [{ count: '1' }];
    mockRedisDel.mockResolvedValue(1);
    mockCreateNotification.mockResolvedValue(true);
    mockDb.mockImplementation((table: string) => createQueryBuilder(table));
  });

  describe('list', () => {
    it('returns reports list with pagination and total count', async () => {
      const dummyReports = [
        { id: 1, title: 'Sensor pH Rusak', station_uuid: 'ST-001', status: 'Open' }
      ];
      mockReportsData = dummyReports;
      mockCountResult = [{ count: '1' }];

      const req: any = { query: { limit: '10', offset: '0' } };
      const res = createResponseDouble();

      await ReportCtl.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: dummyReports,
        total: 1
      }));
    });

    it('applies station_uuid and status filters', async () => {
      mockReportsData = [];
      const req: any = { query: { station_uuid: 'ST-001', status: 'Open' } };
      const res = createResponseDouble();

      await ReportCtl.list(req, res);

      expect(mockWhere).toHaveBeenCalledWith('reports', 'station_uuid', 'ST-001');
      expect(mockWhere).toHaveBeenCalledWith('reports', 'status', 'Open');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns error response when query throws', async () => {
      mockDb.mockImplementationOnce(() => {
        throw new Error('DB connection failure');
      });

      const req: any = { query: {} };
      const res = createResponseDouble();

      await ReportCtl.list(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'DB connection failure'
      }));
    });
  });

  describe('detail', () => {
    it('returns report detail with linked history', async () => {
      const dummyReport = { id: 1, title: 'Pompa Air Mati', station_uuid: 'ST-002', status: 'Open' };
      const dummyLogs = [
        { id: 10, report_id: 1, progress: 'Pengerjaan', description: 'Sedang dicek teknisi' }
      ];
      mockFirst.mockResolvedValueOnce(dummyReport);
      mockLogsData = dummyLogs;

      const req: any = { params: { id: '1' } };
      const res = createResponseDouble();

      await ReportCtl.detail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 1,
          title: 'Pompa Air Mati',
          history: dummyLogs
        })
      }));
    });

    it('returns 404 when report is not found', async () => {
      mockFirst.mockResolvedValueOnce(null);

      const req: any = { params: { id: '999' } };
      const res = createResponseDouble();

      await ReportCtl.detail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Report not found'
      }));
    });
  });

  describe('create', () => {
    it('successfully creates a new report with status Open', async () => {
      const dummyCreated = {
        id: 5,
        title: 'Sensor DO Unstable',
        station_uuid: 'ST-003',
        description: 'Nilai DO melonjak',
        category: 'Perbaikan',
        status: 'Open',
        pic_id: 10,
        pic_name: 'febry'
      };
      mockFirst.mockResolvedValueOnce(dummyCreated);

      const req: any = {
        body: {
          title: 'Sensor DO Unstable',
          station_uuid: 'ST-003',
          description: 'Nilai DO melonjak',
          category: 'Perbaikan'
        },
        user: { user_id: 10, username: 'febry' }
      };
      const res = createResponseDouble();

      await ReportCtl.create(req, res);

      expect(mockInsert).toHaveBeenCalledWith('reports', expect.objectContaining({
        title: 'Sensor DO Unstable',
        station_uuid: 'ST-003',
        category: 'Perbaikan',
        status: 'Open',
        pic_id: 10,
        pic_name: 'febry'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Report created successfully',
        data: dummyCreated
      }));
    });

    it('validates required fields', async () => {
      const req: any = {
        body: {
          title: 'Missing station'
        },
        user: { user_id: 10, username: 'febry' }
      };
      const res = createResponseDouble();

      await ReportCtl.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Title, Station UUID, and Category are required'
      }));
    });
  });

  describe('update', () => {
    it('returns 404 if report is not found', async () => {
      mockFirst.mockResolvedValueOnce(null);

      const req: any = { params: { id: '99' }, body: { title: 'Update Title' } };
      const res = createResponseDouble();

      await ReportCtl.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Report not found'
      }));
    });

    it('updates report title, description, category, and status', async () => {
      const existingReport = { id: 1, title: 'Old Title', status: 'Open' };
      const updatedReport = { id: 1, title: 'New Title', status: 'Eskalasi' };
      mockFirst
        .mockResolvedValueOnce(existingReport)
        .mockResolvedValueOnce(updatedReport);

      const req: any = {
        params: { id: '1' },
        body: { title: 'New Title', status: 'Eskalasi' },
        user: { role_id: 'eng' }
      };
      const res = createResponseDouble();

      await ReportCtl.update(req, res);

      expect(mockUpdate).toHaveBeenCalledWith('reports', expect.objectContaining({
        title: 'New Title',
        status: 'Eskalasi'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Report updated successfully',
        data: updatedReport
      }));
    });

    it('rejects invalid status update', async () => {
      const existingReport = { id: 1, title: 'Old Title', status: 'Open' };
      mockFirst.mockResolvedValueOnce(existingReport);

      const req: any = {
        params: { id: '1' },
        body: { status: 'Closed' },
        user: { role_id: 'eng' }
      };
      const res = createResponseDouble();

      await ReportCtl.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Status must be one of: Open, Eskalasi, Selesai'
      }));
    });

    it('prevents non-admin user from updating pic', async () => {
      const existingReport = { id: 1, title: 'Old Title', pic_name: 'budi' };
      mockFirst.mockResolvedValueOnce(existingReport);

      const req: any = {
        params: { id: '1' },
        body: { pic_name: 'agus' },
        user: { role_id: 'eng', role_name: 'engineer' }
      };
      const res = createResponseDouble();

      await ReportCtl.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Only Admin can change PIC'
      }));
    });

    it('allows admin user to update pic', async () => {
      const existingReport = { id: 1, title: 'Old Title', pic_name: 'budi' };
      const updatedReport = { id: 1, title: 'Old Title', pic_name: 'agus', pic_id: 12 };
      mockFirst
        .mockResolvedValueOnce(existingReport)
        .mockResolvedValueOnce(updatedReport);

      const req: any = {
        params: { id: '1' },
        body: { pic_name: 'agus', pic_id: 12 },
        user: { role_id: 'adm', role_name: 'admin' }
      };
      const res = createResponseDouble();

      await ReportCtl.update(req, res);

      expect(mockUpdate).toHaveBeenCalledWith('reports', expect.objectContaining({
        pic_name: 'agus',
        pic_id: 12
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('followUp', () => {
    it('returns 404 when report not found', async () => {
      mockFirst.mockResolvedValueOnce(null);

      const req: any = {
        params: { id: '99' },
        body: { description: 'Perbaikan sensor' }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Report not found'
      }));
    });

    it('validates description is required', async () => {
      const dummyReport = { id: 1, title: 'Sensor Rusak', station_uuid: 'ST-001' };
      mockFirst.mockResolvedValueOnce(dummyReport);

      const req: any = {
        params: { id: '1' },
        body: { description: '   ' }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Description is required for follow-up'
      }));
    });

    it('rejects invalid status in follow-up', async () => {
      const dummyReport = { id: 1, title: 'Sensor Rusak', station_uuid: 'ST-001' };
      mockFirst.mockResolvedValueOnce(dummyReport);

      const req: any = {
        params: { id: '1' },
        body: { description: 'Perbaikan kabel', status: 'InvalidStatus' }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Status must be one of: Open, Eskalasi, Selesai'
      }));
    });

    it('handles default follow-up (only description): status Eskalasi, progress Pengerjaan', async () => {
      const dummyReport = { id: 1, title: 'Sensor pH Rusak', station_uuid: 'ST-001', status: 'Open' };
      const updatedReport = { id: 1, title: 'Sensor pH Rusak', station_uuid: 'ST-001', status: 'Eskalasi' };
      const dummyLogs = [
        { id: 1, report_id: 1, progress: 'Pengerjaan', description: 'Teknisi tiba di lokasi' }
      ];
      mockFirst
        .mockResolvedValueOnce(dummyReport)
        .mockResolvedValueOnce(updatedReport);
      mockLogsData = dummyLogs;

      const req: any = {
        params: { id: '1' },
        body: { description: 'Teknisi tiba di lokasi' },
        user: { username: 'teknisi1' }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      // Verify maintenance log inserted
      expect(mockInsert).toHaveBeenCalledWith('maintenance_logs', expect.objectContaining({
        uuid: 'ST-001',
        status: 'maintenance',
        activity_type: 'Tindak Lanjut Perbaikan',
        description: 'Teknisi tiba di lokasi',
        progress: 'Pengerjaan',
        report_id: 1,
        created_by: 'teknisi1'
      }));

      // Verify report updated to Eskalasi
      expect(mockUpdate).toHaveBeenCalledWith('reports', expect.objectContaining({
        status: 'Eskalasi'
      }));

      // Verify notification sent
      expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
        category: 'maintenance',
        type: 'logbook',
        severity: 'info',
        uuid: 'ST-001',
        entity_id: '1',
        created_by: 'teknisi1'
      }));

      // Redis del should not be called for Eskalasi
      expect(mockRedisDel).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Tindak lanjut laporan berhasil disimpan',
        data: expect.objectContaining({
          id: 1,
          status: 'Eskalasi',
          history: dummyLogs
        })
      }));
    });

    it('handles follow-up with progress Pengerjaan', async () => {
      const dummyReport = { id: 2, title: 'Modem Offline', station_uuid: 'ST-002', status: 'Open' };
      const updatedReport = { id: 2, title: 'Modem Offline', station_uuid: 'ST-002', status: 'Eskalasi' };
      mockFirst
        .mockResolvedValueOnce(dummyReport)
        .mockResolvedValueOnce(updatedReport);

      const req: any = {
        params: { id: '2' },
        body: {
          progress: 'Pengerjaan',
          activity_type: 'Pergantian Antena',
          description: 'Mengganti antena modem yang patah'
        }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      expect(mockInsert).toHaveBeenCalledWith('maintenance_logs', expect.objectContaining({
        uuid: 'ST-002',
        status: 'maintenance',
        activity_type: 'Pergantian Antena',
        progress: 'Pengerjaan',
        created_by: 'Petugas'
      }));
      expect(mockUpdate).toHaveBeenCalledWith('reports', expect.objectContaining({
        status: 'Eskalasi'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles follow-up with progress Selesai: status Selesai, updates station instrument_status, deletes redis key, and sends notification', async () => {
      const dummyReport = { id: 3, title: 'Listrik Padam', station_uuid: 'ST-003', status: 'Eskalasi' };
      const updatedReport = { id: 3, title: 'Listrik Padam', station_uuid: 'ST-003', status: 'Selesai' };
      mockFirst
        .mockResolvedValueOnce(dummyReport)
        .mockResolvedValueOnce(updatedReport);

      const req: any = {
        params: { id: '3' },
        body: {
          progress: 'Selesai',
          description: 'Genset cadangan sudah aktif dan daya kembali stabil',
          photo_url: 'https://cdn.example.com/genset.jpg'
        },
        user: { username: 'eng_rudi' }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      // Verify maintenance log inserted with status 'start' and progress 'Selesai'
      expect(mockInsert).toHaveBeenCalledWith('maintenance_logs', expect.objectContaining({
        uuid: 'ST-003',
        status: 'start',
        description: 'Genset cadangan sudah aktif dan daya kembali stabil',
        progress: 'Selesai',
        photo_url: 'https://cdn.example.com/genset.jpg',
        created_by: 'eng_rudi'
      }));

      // Verify report updated to Selesai
      expect(mockUpdate).toHaveBeenCalledWith('reports', expect.objectContaining({
        status: 'Selesai'
      }));

      // Verify station instrument_status updated to NORMAL
      expect(mockWhere).toHaveBeenCalledWith('stations', 'id_mesin', 'ST-003');
      expect(mockUpdate).toHaveBeenCalledWith('stations', { instrument_status: 'NORMAL' });

      // Verify Redis key removed
      expect(mockRedisDel).toHaveBeenCalledWith('maintenance:ST-003');

      // Verify notification sent
      expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({
        category: 'maintenance',
        type: 'logbook',
        title: 'Tindak Lanjut Laporan: Listrik Padam',
        uuid: 'ST-003',
        created_by: 'eng_rudi'
      }));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Tindak lanjut laporan berhasil disimpan',
        data: expect.objectContaining({
          id: 3,
          status: 'Selesai'
        })
      }));
    });

    it('handles follow-up with status Selesai directly', async () => {
      const dummyReport = { id: 4, title: 'Kabel Longgar', station_uuid: 'ST-004', status: 'Eskalasi' };
      const updatedReport = { id: 4, title: 'Kabel Longgar', station_uuid: 'ST-004', status: 'Selesai' };
      mockFirst
        .mockResolvedValueOnce(dummyReport)
        .mockResolvedValueOnce(updatedReport);

      const req: any = {
        params: { id: '4' },
        body: {
          status: 'Selesai',
          description: 'Kabel sudah dikencangkan kembali'
        }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      expect(mockInsert).toHaveBeenCalledWith('maintenance_logs', expect.objectContaining({
        uuid: 'ST-004',
        status: 'start',
        progress: 'Selesai'
      }));
      expect(mockUpdate).toHaveBeenCalledWith('reports', expect.objectContaining({
        status: 'Selesai'
      }));
      expect(mockUpdate).toHaveBeenCalledWith('stations', { instrument_status: 'NORMAL' });
      expect(mockRedisDel).toHaveBeenCalledWith('maintenance:ST-004');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('does not crash if redis or notification service throws', async () => {
      const dummyReport = { id: 5, title: 'Error handling test', station_uuid: 'ST-005', status: 'Open' };
      const updatedReport = { id: 5, title: 'Error handling test', station_uuid: 'ST-005', status: 'Selesai' };
      mockFirst
        .mockResolvedValueOnce(dummyReport)
        .mockResolvedValueOnce(updatedReport);

      mockRedisDel.mockRejectedValueOnce(new Error('Redis connection failed'));
      mockCreateNotification.mockRejectedValueOnce(new Error('Notification failed'));

      const req: any = {
        params: { id: '5' },
        body: {
          progress: 'Selesai',
          description: 'Selesai perbaikan meski redis offline'
        }
      };
      const res = createResponseDouble();

      await ReportCtl.followUp(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Tindak lanjut laporan berhasil disimpan'
      }));
    });
  });

  describe('delete', () => {
    it('returns 404 when report does not exist', async () => {
      mockFirst.mockResolvedValueOnce(null);

      const req: any = { params: { id: '123' } };
      const res = createResponseDouble();

      await ReportCtl.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Report not found'
      }));
    });

    it('unlinks maintenance_logs and deletes report', async () => {
      const dummyReport = { id: 10, title: 'Report to delete', station_uuid: 'ST-010' };
      mockFirst.mockResolvedValueOnce(dummyReport);

      const req: any = { params: { id: '10' } };
      const res = createResponseDouble();

      await ReportCtl.delete(req, res);

      expect(mockWhere).toHaveBeenCalledWith('maintenance_logs', 'report_id', '10');
      expect(mockUpdate).toHaveBeenCalledWith('maintenance_logs', { report_id: null });
      expect(mockWhere).toHaveBeenCalledWith('reports', { id: '10' });
      expect(mockDelete).toHaveBeenCalledWith('reports');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Laporan berhasil dihapus'
      }));
    });
  });
});
