import * as express from 'express';
let router = express.Router();

//import sub routes
import testRouter from './test/index';
import authLoginRouter from './auth/login';
import syncRouter from './sync/index';
import dataRouter from './data/index';
import inventoryRouter from './inventory/index';
import pengajuanRouter from './pengajuan/index';
import monitoringRouter from './monitoring/index'
import maintenanceRouter from './maintenance/index';
import billingRouter from './billing/index';
import reportsRouter from './reports/index';
import calibrationRouter from './calibration/index';
const CalibrationCtl = require('../controllers/CalibrationController').default;

router.get('/', (req: any, res: any) => res.send('Bismillah Service API'));

// public verification route
router.get('/verify/:uuid', (req: any, res: any) => CalibrationCtl.verify(req, res));

// public signed media streaming route
router.get('/calibration-media/:docId', (req: any, res: any) => CalibrationCtl.streamMedia(req, res));

//routes auth
router.use('/test', testRouter);
router.use('/auth', authLoginRouter);
router.use('/sync', syncRouter);
router.use('/data', dataRouter);
router.use('/inventory', inventoryRouter);
router.use('/pengajuan', pengajuanRouter);
router.use('/monitoring', monitoringRouter);
router.use('/maintenance', maintenanceRouter);
router.use('/billing', billingRouter);
router.use('/reports', reportsRouter);
router.use('/calibrations', calibrationRouter);

export = router;
