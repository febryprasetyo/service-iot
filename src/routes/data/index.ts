import * as express from 'express';

//Controller
import DataClientController from '../../controllers/DataClientController';
const DataClientCtl = new DataClientController()

import { JwtMiddleware } from '../../middlewares/jwtMiddleware';

let router = express.Router()

router.get('/province-list', JwtMiddleware('adm:user'), DataClientCtl.handleProvinceList)
router.get('/city-list/:province_id?', JwtMiddleware('adm:user'), DataClientCtl.handleCityList)
router.post('/list', JwtMiddleware('adm'), DataClientCtl.handleList)
router.post('/create', JwtMiddleware('adm'), DataClientCtl.handleCreate)
router.post('/update', JwtMiddleware('adm'), DataClientCtl.handleUpdate)
router.post('/delete', JwtMiddleware('adm'), DataClientCtl.handleDelete)

export = router