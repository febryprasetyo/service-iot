import * as express from 'express';

//Controller
import { runRetention } from '../../controllers/RetentionJobController'
import IntegrationController from '../../controllers/IntegrationController';
const SyncCtl = new IntegrationController()

let router = express.Router()

router.post('/submit', SyncCtl.handleSubmitData)
// router.get('/data/res_menlhk', SyncCtl.handleGetData)
router.get('/send/res_menlhk', SyncCtl.handleSendData)


// ✅ Endpoint untuk trigger retention via curl
router.get('/retention', async (req, res) => {
  try {
    await runRetention();
    res.status(200).json({ success: true, message: 'Retention executed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Retention failed.', error: String(err) });
  }
});

export = router