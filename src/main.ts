import express from "express";
import createError from "http-errors";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from 'http';
import multer from 'multer'
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import fs = require('fs');
import { logger, db, loadConfig } from './utils/util'
import { RequestLogger } from "./utils/requestlogger";
import { ResponseLogger } from "./utils/responselogger";
import routes from './routes/index'
import scheduledFunction from "./utils/processData"
import MqttHandler from "./config/mqttHandler";

const upload = multer()

const port = normalizePort(process.env.PORT || 3000)
const app = express()
var server = http.createServer(app);

/* Swagger files start */
// const swaggerFile: any = (process.cwd()+"/src/swagger/swagger.json");
// const swaggerData: any = fs.readFileSync(swaggerFile, 'utf8');
// const swaggerDocument = JSON.parse(swaggerData);
import { swagger } from "./swagger/swagger";
const swaggerDocument = JSON.parse(swagger);
/* Swagger files end */

function main() {

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(express.json({
    limit: '10mb'
  }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(upload.any());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(cors({
    origin: '*'
  }))

  app.use(RequestLogger)
  app.use(ResponseLogger)
  
  app.get("/", (req: any, res: any) => res.send("Bismillah Service API"));
  
  app.use('/api', routes)

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, undefined, undefined, undefined));
  
  
  // catch 404 and forward to error handler
  app.use(function(req: any, res: any, next: any) {
    next(createError(404));
  });

  // error handler
  app.use(function(err: any, req: any, res: any, next: any) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

    // render the error page
    console.log(err)
    res.status(err.status || 500);
    res.render('error');
  });

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
}

function normalizePort(val: number | string): number | string | boolean {
  const port: number = typeof val === 'string' ? parseInt(val, 10) : val;
  if (isNaN(port)) {
    return val;
  } else if (port >= 0) {
    return port;
  } else {
    return false;
  }
}

function onError(error: any): void {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

async function onListening() {
    const addr: any = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    db.raw(`SELECT 'connected' AS connected`).catch((err: any) => {
      logger.error('Connection database failure : ', err)
      process.exit(1)
    })
    
    await loadConfig()

    logger.info('Connected database : ', process.env.DB_DATABASE)
    logger.info('SERVER', process.env.NODE_ENV)
    logger.info(`Server Listening on ${bind}`)

    
    //Running & Connect Mqtt
    var mqttClient = new MqttHandler();
    mqttClient.connect();

    //Running scheduler
    let ctx = new scheduledFunction()
    ctx.initScheduledJobs()
}

main();