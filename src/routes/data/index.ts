import * as express from 'express';

//Controller
import DataClientController from '../../controllers/DataClientController';
const DataClientCtl = new DataClientController();
import { DataMonitoringCtl } from '../../controllers/DataMonitoringController';
import { handleMqttExport, getMqttExportHeaders } from "../../controllers/mqtt.controller";


import { JwtMiddleware, JwtMiddlewareOptional } from '../../middlewares/jwtMiddleware';

let router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Station
 *   description: Station management endpoints
 */

/**
 * @swagger
 * /data/station/province-list:
 *   get:
 *     summary: Get list of provinces
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of provinces retrieved successfully
 */
router.get(
  '/station/province-list',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleProvinceList
);

/**
 * @swagger
 * /data/station/city-list/{province_id}:
 *   get:
 *     summary: Get list of cities by province ID
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: province_id
 *         schema:
 *           type: integer
 *         description: Province ID (optional)
 *     responses:
 *       200:
 *         description: List of cities retrieved successfully
 */
router.get(
  '/station/city-list/:province_id?',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleCityList
);

/**
 * @swagger
 * /data/station/list:
 *   post:
 *     summary: Get list of stations
 *     tags: [Station]
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
 *         description: List of stations retrieved successfully
 */
router.post(
  '/station/list',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleList
);

/**
 * @swagger
 * /data/station/device-list:
 *   get:
 *     summary: Get list of devices for station dropdown
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices retrieved successfully
 */
router.get(
  '/station/device-list',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleDeviceList
);

/**
 * @swagger
 * /data/station/create:
 *   post:
 *     summary: Create a new station
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - nama_stasiun
 *               - address
 *               - province_id
 *               - city_id
 *               - nama_dinas
 *             properties:
 *               device_id:
 *                 type: integer
 *               nama_stasiun:
 *                 type: string
 *               address:
 *                 type: string
 *               province_id:
 *                 type: integer
 *               city_id:
 *                 type: integer
 *               nama_dinas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Station created successfully
 */
router.post(
  '/station/create',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleCreate
);

/**
 * @swagger
 * /data/station/update:
 *   post:
 *     summary: Update an existing station
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *               device_id:
 *                 type: integer
 *               nama_stasiun:
 *                 type: string
 *               address:
 *                 type: string
 *               province_id:
 *                 type: integer
 *               city_id:
 *                 type: integer
 *               nama_dinas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Station updated successfully
 */
router.post(
  '/station/update',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleUpdate
);

/**
 * @swagger
 * /data/station/remove:
 *   post:
 *     summary: Remove a station
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Station removed successfully
 */
router.post(
  '/station/remove',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleDelete
);

router.get(
  '/klhk/list',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleKlhkList
);
router.get(
  '/klhk/export',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleKlhkExport
);

/**
 * @swagger
 * tags:
 *   name: Device
 *   description: Device management endpoints
 */

/**
 * @swagger
 * /data/device/create:
 *   post:
 *     summary: Create a new device
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_mesin
 *               - dinas_id
 *               - nama_stasiun
 *             properties:
 *               id_mesin:
 *                 type: string
 *               dinas_id:
 *                 type: integer
 *               nama_stasiun:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device created successfully
 */
router.post(
  '/device/create',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleCreateDevice
);

/**
 * @swagger
 * /data/device/update:
 *   post:
 *     summary: Update an existing device
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *               id_mesin:
 *                 type: string
 *               dinas_id:
 *                 type: integer
 *               nama_stasiun:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 */
router.post(
  '/device/update',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleUpdateDevice
);

/**
 * @swagger
 * /data/device/remove:
 *   post:
 *     summary: Remove a device
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Device removed successfully
 */
router.post(
  '/device/remove',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleRemoveDevice
);

/**
 * @swagger
 * /data/device/list:
 *   post:
 *     summary: Get list of devices
 *     tags: [Device]
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
 *         description: List of devices retrieved successfully
 */
router.post(
  '/device/list',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleListDevice
);

/**
 * @swagger
 * /data/device/dinas-list:
 *   get:
 *     summary: Get list of dinas
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dinas retrieved successfully
 */
router.get(
  '/device/dinas-list',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleListDinas
);

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management endpoints
 */

/**
 * @swagger
 * /data/user/create:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - nama_dinas
 *               - api_key
 *               - secret_key
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               nama_dinas:
 *                 type: string
 *               api_key:
 *                 type: string
 *               secret_key:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created successfully
 */
router.post(
  '/user/create',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleCreateUser
);

/**
 * @swagger
 * /data/user/update:
 *   post:
 *     summary: Update an existing user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               device_id:
 *                 type: integer
 *               api_key:
 *                 type: string
 *               secret_key:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.post(
  '/user/update',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleUpdateUser
);

/**
 * @swagger
 * /data/user/remove:
 *   post:
 *     summary: Remove a user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User removed successfully
 */
router.post(
  '/user/remove',
  JwtMiddleware('adm:eng'),
  DataClientCtl.handleRemoveUser
);

/**
 * @swagger
 * /data/user/list:
 *   post:
 *     summary: Get list of users
 *     tags: [User]
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
 *         description: List of users retrieved successfully
 */
router.post('/user/list', JwtMiddleware('adm:eng'), DataClientCtl.handleListUser);
// router.get('/user/device-list', JwtMiddleware('adm:eng'), DataClientCtl.handleListDeviceUser)

/**
 * @swagger
 * tags:
 *   name: KLHK
 *   description: KLHK data endpoints
 */

/**
 * @swagger
 * /data/klhk/list:
 *   get:
 *     summary: Get list of KLHK data
 *     tags: [KLHK]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of KLHK data retrieved successfully
 */
router.get(
  '/klhk/list',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleKlhkList
);

/**
 * @swagger
 * /data/klhk/export:
 *   get:
 *     summary: Export KLHK data
 *     tags: [KLHK]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KLHK data exported successfully
 */
router.get(
  '/klhk/export',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleKlhkExport
);

/**
 * @swagger
 * tags:
 *   name: MQTT
 *   description: MQTT data endpoints
 */

/**
 * @swagger
 * /data/mqtt/list:
 *   get:
 *     summary: Get list of MQTT data
 *     tags: [MQTT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of MQTT data retrieved successfully
 */
router.get(
  '/mqtt/list',
  JwtMiddleware('adm:eng:usr'),
  DataClientCtl.handleMqttList
);

/**
 * @swagger
 * /data/mqtt/export:
 *   get:
 *     summary: Export MQTT data
 *     tags: [MQTT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MQTT data exported successfully
 */
router.get(
  '/mqtt/export',
  JwtMiddleware('adm:eng:usr'),
  handleMqttExport
);

router.get("/mqtt/export/headers", getMqttExportHeaders);

/**
 * @swagger
 * tags:
 *   name: Station
 *   description: Station monitoring endpoints
 */

/**
 * @swagger
 * /data/station/monitoring:
 *   get:
 *     summary: Get station monitoring data
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Station monitoring data retrieved successfully
 */
router.get('/station/monitoring', JwtMiddleware('adm:eng:usr'), (req, res) =>
  DataMonitoringCtl.handlerMonitoring(req, res)
);

/**
 * @swagger
 * /data/station/status:
 *   get:
 *     summary: Get station status
 *     tags: [Station]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Station status retrieved successfully
 */
router.get(
  '/station/status',
  JwtMiddleware('adm:eng:usr'),
  (req, res) => DataMonitoringCtl.handlerStatus(req, res)
);

/**
 * @swagger
 * /data/datamqtt/list:
 *   get:
 *     summary: Get list of MQTT data (alternative endpoint)
 *     tags: [MQTT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of MQTT data retrieved successfully
 */

/**
 * @swagger
 * /data/ika:
 *   get:
 *     summary: Get IKA Logs
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_dir
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_stasiun
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_mesin
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of IKA logs retrieved successfully
 */
router.get('/ika', JwtMiddlewareOptional('adm:eng:usr'), (req, res) => DataMonitoringCtl.handlerIkaLogs(req, res));

export = router;
