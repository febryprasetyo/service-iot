import { Request, Response, NextFunction } from 'express';

// ── Closure-based DB mock ─────────────────────────────────────────────────────
// Using closure variables avoids issues with jest.clearAllMocks() and chain mocking.
let _dbFirstResult: any = { id: 'record' }; // default: record found
let _dbShouldThrow = false;

jest.mock('../utils/util', () => ({
  db: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    first: jest.fn(async () => {
      if (_dbShouldThrow) throw new Error('DB connection failed');
      return _dbFirstResult;
    })
  }))
}));

// Import middleware AFTER mock is set up
import { requireCalibrationOwner } from './calibrationOwnerMiddleware';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    params: { id: 'cal-uuid-001' },
    user: undefined,
    ...overrides
  } as unknown as Request;
}

function makeRes(): { res: Response; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as unknown as Response, json, status };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('requireCalibrationOwner middleware', () => {
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
    // Reset closure state before each test
    _dbFirstResult = { id: 'record' };
    _dbShouldThrow = false;
  });

  // ── Admin ──────────────────────────────────────────────────────────────────
  describe('admin role (adm)', () => {
    it('should call next() immediately without querying the DB', async () => {
      const { db } = require('../utils/util');
      const req = makeReq({ user: { user_id: 'admin-1', role_id: 'adm' } as any });
      const { res } = makeRes();

      await requireCalibrationOwner(req, res, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledTimes(1);
      // DB should NOT be queried for admin
      expect(db).not.toHaveBeenCalled();
    });
  });

  // ── Engineering ────────────────────────────────────────────────────────────
  describe('engineering role (eng)', () => {
    it('should call next() for engineering role allowing shared access across team', async () => {
      const req = makeReq({ user: { user_id: 'eng-1', role_id: 'eng' } as any });
      const { res } = makeRes();

      await requireCalibrationOwner(req, res, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next() for another engineering user on any calibration report', async () => {
      const req = makeReq({ user: { user_id: 'eng-other', role_id: 'eng' } as any });
      const { res } = makeRes();

      await requireCalibrationOwner(req, res, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  // ── No user context ────────────────────────────────────────────────────────
  describe('missing user context', () => {
    it('should return 401 when req.user is undefined', async () => {
      const req = makeReq({ user: undefined });
      const { res, status } = makeRes();

      await requireCalibrationOwner(req, res, next as unknown as NextFunction);

      expect(next).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(401);
    });
  });

  // ── Unknown role ───────────────────────────────────────────────────────────
  describe('unknown role', () => {
    it('should return 403 for an unrecognised role', async () => {
      const req = makeReq({ user: { user_id: 'usr-1', role_id: 'usr' } as any });
      const { res, status } = makeRes();

      await requireCalibrationOwner(req, res, next as unknown as NextFunction);

      expect(next).not.toHaveBeenCalled();
      expect(status).toHaveBeenCalledWith(403);
    });
  });
});
