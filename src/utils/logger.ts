import express = require('express');
import 'dotenv/config';

const configs : any = {
  pm2: true,
  appenders: {
    console: {
      type: 'console'
    },
    access: {
      type: 'dateFile',
      filename: process.env.LOG_DIR + '/access.log',
      pattern: '-yyyy-MM-dd',
      category: 'http'
    },
    app: {
      type: 'dateFile',
      filename: process.env.LOG_DIR + '/app.log',
      pattern: '-yyyy-MM-dd'
    },
    errorFile: {
      type: 'dateFile',
      filename: process.env.LOG_DIR + '/error.log',
      pattern: '-yyyy-MM-dd'
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile'
    }
  },
  categories: {
    default: {
      appenders: ['app', 'errors', 'console'],
      level: 'DEBUG'
    },
    http: {
      appenders: ['access', 'console'],
      level: 'DEBUG'
    }
  }
};

class Logger {

  static init(app: express.Application): any {

    var log4js: any = require('log4js');
    log4js.configure(configs);
    var logger = log4js.getLogger('default');
    logger.info('Logging start. ');
    app.use(log4js.connectLogger(logger, {
      level: 'auto'
    }));

    return logger;
  }

}

export = Logger