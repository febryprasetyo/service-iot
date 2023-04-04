import * as express from 'express';
let router = express.Router()

//import sub routes
import authRouter from './auth/index'
import testRouter from './test/index'
import authLoginRouter from './auth/login'
import syncRouter from './sync/index'

router.get("/", (req: any, res: any) => res.send("Bismillah Service API"));

//routes auth
router.use('/auth', authRouter)
router.use('/test', testRouter)
router.use('/auth', authLoginRouter)
router.use('/sync', syncRouter)
export = router