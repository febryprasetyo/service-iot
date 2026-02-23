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
  JwtMiddleware('adm:eng'),
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

const ReportCtl = require('../../controllers/ReportController').default;

// Report Routes

/**
 * @swagger
 * /maintenance/reports:
 *   get:
 *     summary: Get list of maintenance reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_uuid
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, Eskalasi, Selesai]
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: List of reports
 */
router.get('/reports', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.list(req, res));

/**
 * @swagger
 * /maintenance/reports/{id}:
 *   get:
 *     summary: Get report details
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Report details with history
 */
router.get('/reports/:id', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.detail(req, res));

/**
 * @swagger
 * /maintenance/reports:
 *   post:
 *     summary: Create new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, station_uuid, category, description]
 *             properties:
 *               title: { type: string }
 *               station_uuid: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Report created
 */
router.post('/reports', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.create(req, res));

/**
 * @swagger
 * /maintenance/reports/{id}:
 *   put:
 *     summary: Update a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               pic_name: { type: string }
 *     responses:
 *       200:
 *         description: Report updated
 */
router.put('/reports/:id', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.update(req, res));

export = router;
