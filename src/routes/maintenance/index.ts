import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
import MaintenanceController from '../../controllers/MaintenanceController';

const MaintenanceCtl = new MaintenanceController();
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Maintenance management endpoints
 */

/**
 * @swagger
 * /maintenance:
 *   post:
 *     summary: Set maintenance status for a device
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uuid
 *               - status
 *             properties:
 *               uuid:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [maintenance, calibration, stop, start]
 *     responses:
 *       200:
 *         description: Maintenance status updated successfully
 *       400:
 *         description: Invalid input or status
 */
router.post(
  '/',
  JwtMiddleware('adm:eng'), // Only admin and engineer can set maintenance
  MaintenanceCtl.handleSetMaintenance
);

/**
 * @swagger
 * /maintenance/history/{uuid}:
 *   get:
 *     summary: Get maintenance history for a station
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: History retrieved successfully
 */
router.get(
  '/history/:uuid',
  JwtMiddleware('adm:eng:usr'),
  MaintenanceCtl.getLogbookHistory
);

/**
 * @swagger
 * /maintenance/calibration-schedule:
 *   post:
 *     summary: Update calibration schedule for a station
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uuid, next_calibration_date]
 *             properties:
 *               uuid: { type: string }
 *               next_calibration_date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */
router.post(
  '/calibration-schedule',
  JwtMiddleware('adm:eng'),
  MaintenanceCtl.handleUpdateCalibration
);

export = router;
