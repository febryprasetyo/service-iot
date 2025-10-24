import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
import OperationalController from '../../controllers/OperationalController'
const OperationalCtl = new OperationalController();
let router = express.Router()


router.get('/pulsa/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaGetById);
router.get('/pulsa',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaGetAll);
router.post('/pulsa',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaCreate);
router.put('/pulsa/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaUpdate);
router.delete('/pulsa/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerPulsaDelete);

router.get('/token/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikGetById);
router.get('/token',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikGetAll);
router.post('/token',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikCreate);
router.put('/token/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikUpdate);
router.delete('/token/:id',JwtMiddleware('adm:eng'), OperationalCtl.handlerListrikDelete);

export = router;
