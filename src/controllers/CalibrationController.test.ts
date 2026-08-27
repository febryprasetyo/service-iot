const mockWhere = jest.fn();
const mockFirst = jest.fn();
const mockDelete = jest.fn();
const mockDb: any = jest.fn();

jest.mock('../utils/logger', () => ({
  init: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() }),
  getLogger: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() })
}));

jest.mock('../utils/notificationService', () => ({
  default: {
    sendNotification: jest.fn(),
    sendCalibrationNotification: jest.fn()
  }
}));

jest.mock('../config/database', () => {
  const mockKnex: any = jest.fn();
  mockKnex.destroy = jest.fn().mockResolvedValue(undefined);
  return mockKnex;
});

jest.mock('../utils/util', () => {
  return {
    logger: { error: jest.fn(), info: jest.fn() },
    sendResponseCustom: jest.fn((res: any, data: any, statusCode = 200) => {
      return res.status(statusCode).json({ success: true, ...data });
    }),
    sendResponseError: jest.fn((res: any, error: any) => {
      const status = error.code === 'E_NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }),
    errorCodes: {},
    createError: (message: string, code = 'E_BAD_REQUEST', detail: any = null) => {
      const error: any = new Error(message);
      error.code = code;
      error.detail = detail;
      return error;
    },
    db: mockDb,
    validateParamsAll: jest.fn(),
  };
});

import CalibrationCtl from './CalibrationController';
import { CALIBRATION_MESSAGES } from '../helpers/CalibrationApiContract';

function createResponseDouble() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('CalibrationController.delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.mockImplementation((tableName: string) => {
      return {
        where: jest.fn().mockImplementation((condition: any) => {
          return {
            first: () => mockFirst(tableName, condition),
            delete: () => mockDelete(tableName, condition),
            then: (resolve: any) => Promise.resolve([]).then(resolve),
          };
        }),
      };
    });
  });

  it('allows role admin (adm) to delete a draft calibration', async () => {
    const req: any = {
      params: { id: 'cal-uuid-1' },
      user: { user_id: '1', role_id: 'adm' }
    };
    const res = createResponseDouble();

    mockFirst.mockResolvedValueOnce({
      id: 'cal-uuid-1',
      status: 'draft',
      report_no: 'CR-2026/VIII/OMS-CMC/001'
    });
    mockDelete.mockResolvedValue(1);

    await CalibrationCtl.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: CALIBRATION_MESSAGES.reportDeleted
    }));
  });

  it('allows role admin (adm) to delete a submitted calibration', async () => {
    const req: any = {
      params: { id: 'cal-uuid-2' },
      user: { user_id: '1', role_id: 'adm' }
    };
    const res = createResponseDouble();

    mockFirst.mockResolvedValueOnce({
      id: 'cal-uuid-2',
      status: 'submitted',
      report_no: 'CR-2026/VIII/OMS-CMC/002'
    });
    mockDelete.mockResolvedValue(1);

    await CalibrationCtl.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: CALIBRATION_MESSAGES.reportDeleted
    }));
  });

  it('allows role admin (adm) to delete an approved calibration', async () => {
    const req: any = {
      params: { id: 'cal-uuid-3' },
      user: { user_id: '1', role_id: 'adm' }
    };
    const res = createResponseDouble();

    mockFirst.mockResolvedValueOnce({
      id: 'cal-uuid-3',
      status: 'approved',
      report_no: 'CR-2026/VIII/OMS-CMC/003'
    });
    mockDelete.mockResolvedValue(1);

    await CalibrationCtl.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: CALIBRATION_MESSAGES.reportDeleted
    }));
  });

  it('allows role engineer (eng) to delete a draft calibration', async () => {
    const req: any = {
      params: { id: 'cal-uuid-4' },
      user: { user_id: '2', role_id: 'eng' }
    };
    const res = createResponseDouble();

    mockFirst.mockResolvedValueOnce({
      id: 'cal-uuid-4',
      status: 'draft',
      report_no: 'CR-2026/VIII/OMS-CMC/004'
    });
    mockDelete.mockResolvedValue(1);

    await CalibrationCtl.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: CALIBRATION_MESSAGES.reportDeleted
    }));
  });

  it('rejects role engineer (eng) when attempting to delete a submitted calibration', async () => {
    const req: any = {
      params: { id: 'cal-uuid-5' },
      user: { user_id: '2', role_id: 'eng' }
    };
    const res = createResponseDouble();

    mockFirst.mockResolvedValueOnce({
      id: 'cal-uuid-5',
      status: 'submitted',
      report_no: 'CR-2026/VIII/OMS-CMC/005'
    });

    await CalibrationCtl.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: CALIBRATION_MESSAGES.deleteDraftOnly
    }));
  });

  it('rejects role engineer (eng) when attempting to delete an approved calibration', async () => {
    const req: any = {
      params: { id: 'cal-uuid-6' },
      user: { user_id: '2', role_id: 'eng' }
    };
    const res = createResponseDouble();

    mockFirst.mockResolvedValueOnce({
      id: 'cal-uuid-6',
      status: 'approved',
      report_no: 'CR-2026/VIII/OMS-CMC/006'
    });

    await CalibrationCtl.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: CALIBRATION_MESSAGES.deleteDraftOnly
    }));
  });

  it('returns 404 when the calibration does not exist', async () => {
    const req: any = {
      params: { id: 'non-existent-uuid' },
      user: { user_id: '1', role_id: 'adm' }
    };
    const res = createResponseDouble();

    mockFirst.mockResolvedValueOnce(null);

    await CalibrationCtl.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: CALIBRATION_MESSAGES.reportNotFound
    }));
  });
});

