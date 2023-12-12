import * as express from 'express';

//Controller
import DataClientController from '../../controllers/DataClientController';
const DataClientCtl = new DataClientController()

import { JwtMiddleware } from '../../middlewares/jwtMiddleware';

let router = express.Router()

router.get('/station/province-list', JwtMiddleware('adm:usr'), DataClientCtl.handleProvinceList)
router.get('/station/city-list/:province_id?', JwtMiddleware('adm:usr'), DataClientCtl.handleCityList)
router.post('/station/list', JwtMiddleware('adm:usr'), DataClientCtl.handleList)
router.get('/station/device-list', JwtMiddleware('adm:usr'), DataClientCtl.handleDeviceList)
router.post('/station/create', JwtMiddleware('adm:usr'), DataClientCtl.handleCreate)
router.post('/station/update', JwtMiddleware('adm:usr'), DataClientCtl.handleUpdate)
router.post('/station/remove', JwtMiddleware('adm:usr'), DataClientCtl.handleDelete)
router.get('/klhk/list', JwtMiddleware('adm:usr'), DataClientCtl.handleKlhkList)

router.post('/device/create', JwtMiddleware('adm'), DataClientCtl.handleCreateDevice)
router.post('/device/update', JwtMiddleware('adm'), DataClientCtl.handleUpdateDevice)
router.post('/device/remove', JwtMiddleware('adm'), DataClientCtl.handleRemoveDevice)
router.post('/device/list', JwtMiddleware('adm'), DataClientCtl.handleListDevice)
router.get('/device/dinas-list', JwtMiddleware('adm'), DataClientCtl.handleListDinas)

router.post('/user/create', JwtMiddleware('adm'), DataClientCtl.handleCreateUser)
router.post('/user/update', JwtMiddleware('adm'), DataClientCtl.handleUpdateUser)
router.post('/user/remove', JwtMiddleware('adm'), DataClientCtl.handleRemoveUser)
router.post('/user/list', JwtMiddleware('adm'), DataClientCtl.handleListUser)
// router.get('/user/device-list', JwtMiddleware('adm'), DataClientCtl.handleListDeviceUser)

export = router