import * as express from 'express';
import { JwtMiddleware } from '../../middlewares/jwtMiddleware';
// import controller
import InventoryController from '../../controllers/InventoryController'
const InventoryCtl = new InventoryController();



let router = express.Router()
// inventory summary
router.get(
  '/stok/total',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleListInventory
);

// inventory 
router.post(
  '/stok/create',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleCreateSensorStock
);
router.post(
  '/stok/',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleListSensorStock
);
router.get(
  '/stok/:id',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleGetSensorStockById
);
router.post(
  '/stok/update/:id',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleUpdateSensorStock
);
router.post(
  '/stok/remove/:id',
  JwtMiddleware('adm:eng'),
  InventoryCtl.handleDeleteSensorStock
);

// tracking
router.get('/tracking/options', JwtMiddleware('adm:eng'), InventoryCtl.handleTrackingDropdownOptions);
router.get('/tracking', JwtMiddleware('adm:eng'), InventoryCtl.handleListTracking);
router.get('/tracking/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleGetTrackingById);
router.post('/tracking', JwtMiddleware('adm:eng'), InventoryCtl.handleCreateTracking);
router.put('/tracking/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleUpdateTracking);
router.delete('/tracking/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleDeleteTracking);


// request
router.post('/requests', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestCreate);
router.get('/requests', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestList);
router.put('/requests/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestUpdate);
router.delete('/requests/:id', JwtMiddleware('adm:eng'), InventoryCtl.handleRequestDelete);
router.put('/requests/:id/approve', JwtMiddleware('adm'), InventoryCtl.handleRequestApprove);
router.put('/requests/:id/reject', JwtMiddleware('adm'), InventoryCtl.handleRequestReject);
router.put('/requests/:id/process', JwtMiddleware('adm'), InventoryCtl.handleRequestProcessUpdate);
export = router;