import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
import { requireCalibrationOwner } from '../../middlewares/calibrationOwnerMiddleware';
import { CALIBRATION_AUTH_MESSAGES } from '../../helpers/CalibrationApiContract';
const CalibrationCtl = require('../../controllers/CalibrationController').default;

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calibrations
 *   description: Water quality monitoring sensor calibration module
 */

// ── Collection routes (no ownership check) ─────────────────────────────────
router.get(
  '/',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  (req, res) => CalibrationCtl.list(req, res)
);

router.get(
  '/parameters',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  (req, res) => CalibrationCtl.parameters(req, res)
);

router.post(
  '/',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  (req, res) => CalibrationCtl.create(req, res)
);

// ── Single-record routes (ownership enforced) ───────────────────────────────
router.get(
  '/:id',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  requireCalibrationOwner,
  (req, res) => CalibrationCtl.detail(req, res)
);

router.put(
  '/:id',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  requireCalibrationOwner,
  (req, res) => CalibrationCtl.update(req, res)
);

router.delete(
  '/:id',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  requireCalibrationOwner,
  (req, res) => CalibrationCtl.delete(req, res)
);

router.post(
  '/:id/submit',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  requireCalibrationOwner,
  (req, res) => CalibrationCtl.submit(req, res)
);

router.post(
  '/:id/approve',
  JwtMiddleware('adm', CALIBRATION_AUTH_MESSAGES),
  // No ownership check: approve is admin-only, admin has full access
  (req, res) => CalibrationCtl.approve(req, res)
);

// Print PDF – now requires auth + ownership
router.get(
  '/:id/print',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  requireCalibrationOwner,
  (req, res) => CalibrationCtl.print(req, res)
);

// ── Photo documentation routes (ownership enforced) ─────────────────────────
router.post(
  '/:id/details/:detailId/documentation/:slot',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  requireCalibrationOwner,
  (req, res) => CalibrationCtl.uploadDocumentation(req, res)
);

router.delete(
  '/:id/details/:detailId/documentation/:slot',
  JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES),
  requireCalibrationOwner,
  (req, res) => CalibrationCtl.deleteDocumentation(req, res)
);

export = router;
