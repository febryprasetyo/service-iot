import * as express from 'express';

//Controller
import IntegrationController from '../../controllers/IntegrationController';
const SyncCtl = new IntegrationController()

let router = express.Router()

router.post('/submit', SyncCtl.handleSubmitData)
router.get('/data/res_menlhk', SyncCtl.handleGetData)

export = router