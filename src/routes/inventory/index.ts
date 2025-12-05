import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
// import controller
import InventoryController from '../../controllers/InventoryController'
const InventoryCtl = new InventoryController();



let router = express.Router()
// inventory summary
/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management endpoints
 */

/**
 * @swagger
 * /inventory/stok/total:
 *   get:
 *     summary: Get total inventory stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total inventory stock retrieved successfully
 */
router.get(
  '/stok/total',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleListInventory
);

/**
 * @swagger
 * /inventory/stok/create:
 *   post:
 *     summary: Create new sensor stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *               - serial_number
 *               - condition
 *             properties:
 *               products:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               condition:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sensor stock created successfully
 */
router.post(
  '/stok/create',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleCreateSensorStock
);

/**
 * @swagger
 * /inventory/stok/:
 *   post:
 *     summary: List sensor stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *               offset:
 *                 type: integer
 *     responses:
 *       200:
 *         description: List of sensor stock retrieved successfully
 */
router.post(
  '/stok/',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleListSensorStock
);

/**
 * @swagger
 * /inventory/stok/{id}:
 *   get:
 *     summary: Get sensor stock by ID
 *     tags: [Inventory]
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
 *         description: Sensor stock details retrieved successfully
 */
router.get(
  '/stok/:id',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleGetSensorStockById
);

/**
 * @swagger
 * /inventory/stok/update/{id}:
 *   post:
 *     summary: Update sensor stock
 *     tags: [Inventory]
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
 *               products:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               condition:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sensor stock updated successfully
 */
router.post(
  '/stok/update/:id',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleUpdateSensorStock
);

/**
 * @swagger
 * /inventory/stok/remove/{id}:
 *   post:
 *     summary: Remove sensor stock
 *     tags: [Inventory]
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
 *         description: Sensor stock removed successfully
 */
router.post(
  '/stok/remove/:id',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleDeleteSensorStock
);

/**
 * @swagger
 * tags:
 *   name: Tracking
 *   description: Tracking management endpoints
 */

/**
 * @swagger
 * /inventory/tracking/options:
 *   get:
 *     summary: Get tracking dropdown options
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tracking options retrieved successfully
 */
router.get('/tracking/options', JwtMiddleware('adm:eng'), InventoryCtl.handleTrackingDropdownOptions);

/**
 * @swagger
 * /inventory/tracking:
 *   get:
 *     summary: List tracking data
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tracking data retrieved successfully
 *   post:
 *     summary: Create tracking data
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *               - serial_number
 *               - nama_stasiun
 *               - pic
 *             properties:
 *               products:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               nama_stasiun:
 *                 type: string
 *               pic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tracking data created successfully
 */
router.get('/tracking', JwtMiddleware('adm:eng'), InventoryCtl.handleListTracking);
router.post('/tracking', JwtMiddleware('adm:eng'), InventoryCtl.handleCreateTracking);

/**
 * @swagger
 * /inventory/tracking/{id}:
 *   get:
 *     summary: Get tracking data by ID
 *     tags: [Tracking]
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
 *         description: Tracking data details retrieved successfully
 *   put:
 *     summary: Update tracking data
 *     tags: [Tracking]
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
 *               products:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               nama_stasiun:
 *                 type: string
 *               pic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tracking data updated successfully
 *   delete:
 *     summary: Delete tracking data
 *     tags: [Tracking]
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
 *         description: Tracking data deleted successfully
 */
router.get('/tracking/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleGetTrackingById);
router.put('/tracking/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleUpdateTracking);
router.delete('/tracking/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleDeleteTracking);


/**
 * @swagger
 * tags:
 *   name: Request
 *   description: Request management endpoints
 */

/**
 * @swagger
 * /inventory/requests:
 *   post:
 *     summary: Create a new request
 *     tags: [Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pic
 *               - products
 *               - stations
 *               - quantity
 *             properties:
 *               pic:
 *                 type: string
 *               products:
 *                 type: string
 *               stations:
 *                 type: string
 *               quantity:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request created successfully
 *   get:
 *     summary: List requests
 *     tags: [Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of requests retrieved successfully
 */
router.post('/requests', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestCreate);
router.get('/requests', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestList);

/**
 * @swagger
 * /inventory/requests/{id}:
 *   put:
 *     summary: Update a request
 *     tags: [Request]
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
 *               pic:
 *                 type: string
 *               products:
 *                 type: string
 *               stations:
 *                 type: string
 *               quantity:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request updated successfully
 *   delete:
 *     summary: Delete a request
 *     tags: [Request]
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
 *         description: Request deleted successfully
 */
router.put('/requests/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestUpdate);
router.delete('/requests/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestDelete);

/**
 * @swagger
 * /inventory/requests/{id}/approve:
 *   put:
 *     summary: Approve a request
 *     tags: [Request]
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
 *         description: Request approved successfully
 */
router.put('/requests/:id/approve', JwtMiddleware('adm'), InventoryCtl.handleRequestApprove);

/**
 * @swagger
 * /inventory/requests/{id}/reject:
 *   put:
 *     summary: Reject a request
 *     tags: [Request]
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
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected successfully
 */
router.put('/requests/:id/reject', JwtMiddleware('adm'), InventoryCtl.handleRequestReject);

/**
 * @swagger
 * /inventory/requests/{id}/process:
 *   put:
 *     summary: Update request process stage
 *     tags: [Request]
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
 *             required:
 *               - process_stage
 *             properties:
 *               process_stage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request process stage updated successfully
 */
router.put('/requests/:id/process', JwtMiddleware('adm'), InventoryCtl.handleRequestProcessUpdate);
export = router;