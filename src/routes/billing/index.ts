import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
import BillingController from '../../controllers/BillingController';

const BillingCtl = new BillingController();
let router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing management endpoints
 */

/**
 * @swagger
 * /billing/summary:
 *   get:
 *     summary: Get billing summary
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Billing summary retrieved successfully
 */
router.get('/summary', JwtMiddleware('adm:eng:usr'), BillingCtl.handleSummary);

/**
 * @swagger
 * /billing/status:
 *   put:
 *     summary: Update billing or reimbursement status
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - id
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [paket, token]
 *               id:
 *                 type: integer
 *               billing_status:
 *                 type: string
 *               reimbursement_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.put('/status', JwtMiddleware('adm'), BillingCtl.handleUpdateStatus);

/**
 * @swagger
 * /billing/history:
 *   get:
 *     summary: Get billing history for the last 3 months
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Billing history retrieved successfully
 */
router.get('/history', JwtMiddleware('adm:eng:usr'), BillingCtl.handleHistory);

export = router;
