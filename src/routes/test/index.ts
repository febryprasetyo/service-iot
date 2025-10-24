import * as express from 'express';

//Controller
import TestingController from '../../controllers/TestingController';
const TestCtl = new TestingController()

let router = express.Router()

router.post('/validator', TestCtl.testValidator)
router.post('/upload-file', TestCtl.testUploadFile)

export = router