import * as express from 'express';

//Controller
import IntegrationController from '../../controllers/IntegrationController';
const SyncCtl = new IntegrationController()

let router = express.Router()

router.post('/submit', SyncCtl.handleSubmitData)

export = router