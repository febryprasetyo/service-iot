import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/util';

const OWNERSHIP_DENIED_MESSAGE = 'Anda tidak memiliki akses ke laporan kalibrasi ini.';
const ADMIN_ROLE_ID = 'adm';
const ENGINEER_ROLE_ID = 'eng';

/**
 * Middleware: requireCalibrationOwner
 *
 * Ensures that an engineering user (`eng`) can only access calibration records
 * they created (officer_id === user_id). Admin users (`adm`) bypass this check.
 *
 * Must be placed AFTER JwtMiddleware so that req.user is already populated.
 * Requires `req.params.id` to be the calibration UUID.
 */
export async function requireCalibrationOwner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.user as { user_id: string; role_id: string } | undefined;

  // If no user context (should not happen after JwtMiddleware), deny access
  if (!user) {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sesi telah berakhir.' });
    return;
  }

  // Admin and Engineering roles have team-wide shared access to calibration reports
  if (user.role_id === ADMIN_ROLE_ID || user.role_id === ENGINEER_ROLE_ID) {
    next();
    return;
  }

  // Any other unauthorized role (e.g. standard user) - deny
  res.status(403).json({ success: false, message: OWNERSHIP_DENIED_MESSAGE });
}
