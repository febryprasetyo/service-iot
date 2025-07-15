import express from 'express';
const app = express()
import jwt from 'jwt-simple';
import 'dotenv/config';
import db from '../config/database';
import validatorMessages from '../config/validatorMessages';
import { validator } from 'indicative'
import _, { reject } from 'lodash'
import moment from 'moment'
import FormData from 'form-data';
import axios from 'axios'
import fs from 'fs';

let config: any = {}

const logger = require('./logger').init(app);

const errorCodes: any = { E_BAD_REQUEST: 400, E_NOT_FOUND: 404, E_UNAUTHORIZED: 401, E_INTERNAL: 500, E_FILE_NOT_FOUND: 404 }

/**
 * Load configuration from file env and db
 *
 */
async function loadConfig() {
  try {
    logger.info('>>> LOADING APPLICATION CONFIG....');
    var data = await db.select(db.raw(`
      *
      FROM r_config
    `))
    let newConfig: any = {};
    newConfig['env'] = {
      HOST: process.env.HOST,
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      APP_URL: process.env.APP_URL,
      LOG_DIR: process.env.LOG_DIR,
      ASSET_DIR: process.env.ASSET_DIR,
      MAIL_CONNECTION: process.env.MAIL_CONNECTION,
      MAIL_HOST: process.env.MAIL_HOST,
      MAIL_PORT: process.env.MAIL_PORT,
      MAIL_USERNAME: process.env.MAIL_USERNAME,
      MAIL_PASSWORD: process.env.MAIL_PASSWORD,
      MAIL_SECURE: process.env.MAIL_SECURE,
      MAIL_TLS: process.env.MAIL_TLS,
    }

    var val = null;
    var config_type = '';
    for (var i = 0; i < data.length; i++) {
      config_type = data[i].type;
      val = data[i].value;
      if (config_type == 'INT')
        val = parseInt(val);
      else if (config_type == 'FLOAT')
        val = parseFloat(val);
      else if (config_type == 'TEXT')
        val = val;
      else if (config_type == 'JSON')
        val = JSON.parse(val);
      else if (config_type == 'BOOLEAN')
        val = (val.toLowerCase() == 'true');

      newConfig[data[i].code] = val;

    }
    config = deleteAllKeys(config)
    config = _.assign(config, newConfig)

    if (process.env.NODE_ENV === 'development') logger.debug('config:\n' + JSON.stringify(config))
    logger.info('>>> APPLICATION CONFIG HAS BEEN LOADED >>>');

  } catch (error) {
    logger.error(error)
  }
}

async function getConfig() {
  await loadConfig()
  return config
}
/**
 * Function check empty data from variable
 * @param x 
 * @returns 
 */
function isEmpty(x: any) {
  try {
    if (x === undefined)
      return true;
    else if (x === null)
      return true;
    else if (x.toString().trim() === '')
      return true;
    else
      return false;
  } catch (error) {
    return true;
  }
}

/**
 * Function check is not empty data from variable
 * @param x 
 * @returns 
 */
function isNotEmpty(x: any) {
  return !isEmpty(x);
}

/**
 * Create custom error.
 *
 * @param {any} message
 * @param {string} [code='E_BAD_REQUEST'] Options: E_BAD_REQUEST, E_NOT_FOUND, E_UNAUTHORIZED, E_INTERNAL
 */
function createError(message: any, code = 'E_BAD_REQUEST', detail = null) {
  const error: any = new Error(message)
  error.code = code
  error.detail = detail
  return error
}

/**
 * Custom Response to client
 *
 * @param {any} response
 * @param {any} statusCode
 * @param {any} body
 */
function sendResponseCustom(res: any, data: any, statusCode = 200) {
  var resBody = data
  if (!resBody)
    resBody = {}
  const success = (statusCode == 200 || statusCode == 201) ? true : false
  resBody = { success, ...resBody }
  res.status(statusCode).json(resBody);
}


/**
 * Send error response to client
 *
 * @param {any} res
 * @param {any} error
 * @param {number} [statusCode=400]
 */
function sendResponseError(res: any, error: any, statusCode: any = null) {
  logger.info('error length ', error)
  logger.info('error length ', JSON.stringify(error))
  if (isNotEmpty(error)) {
    statusCode = errorCodes[error.code || ''] || statusCode || 500
    var message = error.message || error.code || ''
    if (statusCode === 500) message = 'INTERNAL ERROR: ' + message
    var error_detail = undefined
    if (statusCode === 500 && process.env.SHOW_ERROR_DETAIL) {
      error_detail = error.detail || error.stack || 'Unknown error'
    }
    if (error.detail) error_detail = error.detail

    sendResponseCustom(res, { message, error_detail }, statusCode)
  } else
    sendResponseCustom(res, { message: 'Internal backend error' }, statusCode)
}

function isValidateToken(token: any) {
  let jwtKey: any = process.env.JWT_SECRET_KEY
  try {
    if (token) {
      let decode = jwt.decode(token, jwtKey)
      return (decode.exp >= Date.now())
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}

/**
 * Function validation request api
 * @param req 
 * @param fields 
 * @returns 
 */
function validateParams(req: any, fields: any) {
  for (const field of fields) {
    if (!req.body[field]) {
      return {
        status: 400,
        message_id: `Params ${field} tidak boleh kosong!`,
        message_en: `Params ${field} is required!`
      }
    }
  }
  return
}

/**
 * Validate parameters.
 * Reference: 
 *    https://adonisjs.com/docs/4.1/validator 
 *    https://indicative.adonisjs.com/ 
 * 
 * @param {any} params 
 * @param {any} rules 
 * @param {any} [customMessages=null]
 * @returns {valid, message} 
 */
async function validateParamsAll(params: any, rules: any) {
  var result = { failed: false, message_en: '', message_id: '' }

  var messageTemplates = { ...validatorMessages }
  await validator.validateAll(params, rules, messageTemplates)
    .then((res) => {
      return result
    })
    .catch((err) => {
      result.failed = true
      var failRequired = [], failOther = []
      const arrMsg = err
      logger.info(`err-------------- : `, err)
      for (var i = 0; i < arrMsg.length; i++) {
        if (arrMsg[i].validation === 'required')
          failRequired.push(arrMsg[i].field)
        else
          failOther.push(arrMsg[i].message)
      }

      if (failRequired.length === 1) {
        result.message_en = 'Parameter ' + failRequired + ' is required'
        result.message_id = 'Parameter ' + failRequired + ' tidak boleh kosong'
      }
      else if (failRequired.length > 1) {
        result.message_en = 'Parameters [' + failRequired + '] is required'
        result.message_id = 'Parameters [' + failRequired + '] tidak boleh kosong'
      }

      if (isNotEmpty(result.message_en) && failOther.length > 0)
        result.message_en += '; '

      if (isNotEmpty(result.message_id) && failOther.length > 0)
        result.message_id += '; '

      for (var i = 0; i < failOther.length; i++) {
        result.message_en += failOther[i] + '; '
        result.message_id += failOther[i].replace('length must be', 'panjang harus') + '; '
      }
      throw result
    })
}

/**
 * Delete all keys of an object
 *
 * @param {any} obj
 */
function deleteAllKeys(obj: any) {
  for (var key in obj) {
    delete obj[key]
  }
  return obj
}

/**
 * Function checking variable numeric
 * @param num 
 * @returns 
 */
function isNumeric(num: any) {
  if (!num)
    return false;
  else if (isNaN(num))
    return false;
  else
    return true;
}

function replaceCommaDot(val: any) {
  return val.replace(/[,.]/g, '')
}

async function checkDir(dir:string) {
  let tempFolder: any = process.env.ASSET_DIR
  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder)
    if (!fs.existsSync(tempFolder+'/temp/')) {
      fs.mkdirSync(tempFolder+'/temp/')
    }
  }
}

function decodeToken(token: any) {
  let jwtKey: any = process.env.JWT_SECRET_KEY
  try {
    if (token) {
      let decode = jwt.decode(token, jwtKey)
      return decode
    } else {
      return null
    }
  } catch (error) {
    return null
  }
}

export {
  logger, db, sendResponseCustom, sendResponseError, errorCodes, isEmpty, isNotEmpty, checkDir,
  createError, isValidateToken, validateParams, validateParamsAll,
  deleteAllKeys, loadConfig, getConfig, isNumeric, moment, replaceCommaDot, decodeToken
}