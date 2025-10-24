import * as express from 'express';
import MonitoringController from '../../controllers/MonitoringController'
const MonitoringCtl = new MonitoringController();
let router = express.Router()


router.get('/:uuid', MonitoringCtl.getMonitoringByUuid);

export = router;
