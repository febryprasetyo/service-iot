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

router.get('/', (req: any, res: any) => res.send('Bismillah Service API'));

//routes auth
router.use('/test', testRouter);
router.use('/auth', authLoginRouter);
router.use('/sync', syncRouter);
router.use('/data', dataRouter);
router.use('/inventory', inventoryRouter);
router.use('/pengajuan', pengajuanRouter);
router.use('/monitoring', monitoringRouter );

export = router;
