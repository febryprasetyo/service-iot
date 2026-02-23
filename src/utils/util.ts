import express from 'express';
const app = express()
import jwt from 'jwt-simple';
import 'dotenv/config';
import db from '../config/database';
import validatorMessages from '../config/validatorMessages';
import { validateAll, sanitize } from 'indicative'
import _, { reject } from 'lodash'
import moment from 'moment-timezone'
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
  return validateAll(params, rules, messageTemplates)
    .then(() => {
      return result
    })
    .catch((err) => {
      result.failed = true
      
      var failRequired = [], failOther = []
      const arrMsg = Array.isArray(err) ? err : [];
      
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
        result.message_en = 'Parameters [' + failRequired + '] are required'
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
      
      if (!result.message_en) {
          result.message_en = 'Validation error occurred';
          result.message_id = 'Terjadi kesalahan validasi';
          if (!Array.isArray(err)) {
              result.message_en += ': ' + (err.message || JSON.stringify(err));
          }
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

function buildPagination(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    // tampilkan semua kalau total page sedikit
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // First page
    pages.push(1);

    if (currentPage > 4) {
      pages.push("...");
    }

    // Pages sekitar current
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push("...");
    }

    // Last page
    pages.push(totalPages);
  }

  return pages;
}

// WIB Timezone Helpers (GMT+7)
const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Get current time in WIB timezone
 * @param format Optional format string, defaults to 'YYYY-MM-DD HH:mm:ss'
 */
function nowWib(format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return moment().tz(WIB_TIMEZONE).format(format);
}

/**
 * Convert any date/time to WIB timezone
 * @param date Date string or Date object
 * @param inputFormat Input format if date is string
 * @param outputFormat Output format, defaults to 'YYYY-MM-DD HH:mm:ss'
 */
function toWib(date: string | Date, inputFormat?: string, outputFormat: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (inputFormat) {
    return moment(date, inputFormat).tz(WIB_TIMEZONE).format(outputFormat);
  }
  return moment(date).tz(WIB_TIMEZONE).format(outputFormat);
}


export {
  logger, db, sendResponseCustom, sendResponseError, errorCodes, isEmpty, isNotEmpty, checkDir,
  createError, isValidateToken, validateParams, validateParamsAll,
  deleteAllKeys, loadConfig, getConfig, isNumeric, moment, replaceCommaDot, decodeToken,
  buildPagination, nowWib, toWib, WIB_TIMEZONE
}