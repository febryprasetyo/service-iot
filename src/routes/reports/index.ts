import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
const ReportCtl = require('../../controllers/ReportController').default;

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Maintenance reports management
 */

router.get('/', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.list(req, res));
router.get('/:id', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.detail(req, res));
router.post('/', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.create(req, res));
router.put('/:id', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.update(req, res));
router.post('/:id/follow-up', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.followUp(req, res));
router.delete('/:id', JwtMiddleware('adm:eng'), (req, res) => ReportCtl.delete(req, res));

export = router;
