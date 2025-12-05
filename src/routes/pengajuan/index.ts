import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
import OperationalController from '../../controllers/OperationalController'
const OperationalCtl = new OperationalController();
let router = express.Router()


/**
 * @swagger
 * tags:
 *   name: Pengajuan Pulsa
 *   description: Pengajuan Pulsa management endpoints
 */

/**
 * @swagger
 * /pengajuan/pulsa/{id}:
 *   get:
 *     summary: Get pengajuan pulsa by ID
 *     tags: [Pengajuan Pulsa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pengajuan pulsa details retrieved successfully
 */
router.get('/pulsa/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaGetById);

/**
 * @swagger
 * /pengajuan/pulsa:
 *   get:
 *     summary: Get all pengajuan pulsa
 *     tags: [Pengajuan Pulsa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pengajuan pulsa retrieved successfully
 *   post:
 *     summary: Create pengajuan pulsa
 *     tags: [Pengajuan Pulsa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nominal
 *               - station
 *             properties:
 *               nominal:
 *                 type: number
 *               station:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pengajuan pulsa created successfully
 */
router.get('/pulsa',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaGetAll);
router.post('/pulsa',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaCreate);

/**
 * @swagger
 * /pengajuan/pulsa/{id}:
 *   put:
 *     summary: Update pengajuan pulsa
 *     tags: [Pengajuan Pulsa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nominal:
 *                 type: number
 *               station:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pengajuan pulsa updated successfully
 *   delete:
 *     summary: Delete pengajuan pulsa
 *     tags: [Pengajuan Pulsa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pengajuan pulsa deleted successfully
 */
router.put('/pulsa/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaUpdate);
router.delete('/pulsa/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaDelete);

/**
 * @swagger
 * tags:
 *   name: Pengajuan Token
 *   description: Pengajuan Token Listrik management endpoints
 */

/**
 * @swagger
 * /pengajuan/token/{id}:
 *   get:
 *     summary: Get pengajuan token by ID
 *     tags: [Pengajuan Token]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pengajuan token details retrieved successfully
 */
router.get('/token/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikGetById);

/**
 * @swagger
 * /pengajuan/token:
 *   get:
 *     summary: Get all pengajuan token
 *     tags: [Pengajuan Token]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pengajuan token retrieved successfully
 *   post:
 *     summary: Create pengajuan token
 *     tags: [Pengajuan Token]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nominal
 *               - station
 *             properties:
 *               nominal:
 *                 type: number
 *               station:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pengajuan token created successfully
 */
router.get('/token',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikGetAll);
router.post('/token',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikCreate);

/**
 * @swagger
 * /pengajuan/token/{id}:
 *   put:
 *     summary: Update pengajuan token
 *     tags: [Pengajuan Token]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nominal:
 *                 type: number
 *               station:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pengajuan token updated successfully
 *   delete:
 *     summary: Delete pengajuan token
 *     tags: [Pengajuan Token]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pengajuan token deleted successfully
 */
router.put('/token/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikUpdate);
router.delete('/token/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikDelete);

export = router;
