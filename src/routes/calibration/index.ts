import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
const CalibrationCtl = require('../../controllers/CalibrationController').default;

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calibrations
 *   description: Water quality monitoring sensor calibration module
 */

router.get('/', JwtMiddleware('adm:eng'), (req, res) => CalibrationCtl.list(req, res));
router.get('/parameters', JwtMiddleware('adm:eng'), (req, res) => CalibrationCtl.parameters(req, res));
router.get('/:id', JwtMiddleware('adm:eng'), (req, res) => CalibrationCtl.detail(req, res));
router.post('/', JwtMiddleware('adm:eng'), (req, res) => CalibrationCtl.create(req, res));
router.put('/:id', JwtMiddleware('adm:eng'), (req, res) => CalibrationCtl.update(req, res));
router.delete('/:id', JwtMiddleware('adm:eng'), (req, res) => CalibrationCtl.delete(req, res));
router.post('/:id/submit', JwtMiddleware('adm:eng'), (req, res) => CalibrationCtl.submit(req, res));
router.post('/:id/approve', JwtMiddleware('adm'), (req, res) => CalibrationCtl.approve(req, res));
router.get('/:id/print', (req, res) => CalibrationCtl.print(req, res));

export = router;
