import * as express from 'express';
import MonitoringController from '../../controllers/MonitoringController'
const MonitoringCtl = new MonitoringController();
let router = express.Router()


/**
 * @swagger
 * tags:
 *   name: Monitoring
 *   description: Monitoring endpoints
 */

/**
 * @swagger
 * /monitoring/{uuid}:
 *   get:
 *     summary: Get monitoring data by UUID
 *     tags: [Monitoring]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitoring data retrieved successfully
 */
router.get('/:uuid', MonitoringCtl.getMonitoringByUuid);

export = router;
