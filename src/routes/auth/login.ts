import * as express from 'express';

//Controller
import AuthController from '../../controllers/AuthController';
const AuthCtl = new AuthController()


let router = express.Router()

export = router