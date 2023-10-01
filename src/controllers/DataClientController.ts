import { logger, sendResponseCustom, sendResponseError, 
  errorCodes, createError, validateParamsAll, db} from '../utils/util';
import 'dotenv/config';
import {v4 as uuidv4} from 'uuid';

class DataClientController {

  /**
   * API Handle Province List
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleProvinceList(req: any, res:any) {
    try {

      let data = await db.select(db.raw(`*`)).from('provinces')
      return sendResponseCustom(res, {
        success: true,
        data
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle City List
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleCityList(req: any, res:any) {
    try {
      let provinceId = req.params.province_id

      let query = db.select(db.raw(`*`))
        .from('cities')

      if (provinceId) {
        query = query .whereRaw(`province_id = ?`, provinceId)
      }

      let data = await query

      return sendResponseCustom(res, {
        success: true,
        data
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle List
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleList(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        // user_id: 'required',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`*`)).from('datas')

      return sendResponseCustom(res, {
        success: true,
        data
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle Create
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleCreate(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        user_id: 'required',
        station_id: 'required',
        uuid: 'required',
        // client_id: 'required',
        station_name: 'required',
        address: 'required',
        province_id: 'required',
        city_id: 'required',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let dataProvince = await db.select(db.raw(`*`)).from('provinces').whereRaw(`id = ?`, reqBody.province_id)
      if(dataProvince.length === 0) throw createError('Province not found', 'E_BAD_REQUEST')
      dataProvince = dataProvince[0]

      let dataCity = await db.select(db.raw(`*`)).from('cities').whereRaw(`id = ?`, reqBody.city_id)
      if(dataCity.length === 0) throw createError('City not found', 'E_BAD_REQUEST')
      dataCity = dataCity[0]
      if(dataCity.province_id !== dataProvince.id) throw createError(`City ${dataCity.city_name} not found in Province ${dataProvince.province_name}`, 'E_BAD_REQUEST')

      // let generateUuidv4 = uuidv4()

      await db('datas')
        .insert({
          station_id: reqBody.station_id,
          station_name: reqBody.station_name,
          address: reqBody.address,
          province_id: dataProvince.id,
          province_name: dataProvince.province_name,
          city_id: dataCity.id,
          city_name: dataCity.city_name,
          created_by: reqBody.user_id,
          // uuid: generateUuidv4
          uuid: reqBody.uuid
        })

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil disimpan'
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle Update
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleUpdate(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        id: 'required',
        user_id: 'required',
        station_id: 'required',
        station_name: 'required',
        address: 'required',
        province_id: 'required',
        city_id: 'required',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let dataProvince = await db.select(db.raw(`*`)).from('provinces').whereRaw(`id = ?`, reqBody.province_id)
      if(dataProvince.length === 0) throw createError('Province not found', 'E_BAD_REQUEST')
      dataProvince = dataProvince[0]

      let dataCity = await db.select(db.raw(`*`)).from('cities').whereRaw(`id = ?`, reqBody.city_id)
      if(dataCity.length === 0) throw createError('City not found', 'E_BAD_REQUEST')
      dataCity = dataCity[0]
      if(dataCity.province_id !== dataProvince.id) throw createError(`City ${dataCity.city_name} not found in Province ${dataProvince.province_name}`, 'E_BAD_REQUEST')

      let data = await db.select(db.raw(`*`)).from('datas').whereRaw(`id = ?`, reqBody.id)
      if(data.length === 0) throw createError('Data not found', 'E_BAD_REQUEST')

      await db('datas')
        .whereRaw(`id = ?`, reqBody.id)
        .update({
          station_id: reqBody.station_id,
          station_name: reqBody.station_name,
          address: reqBody.address,
          province_id: dataProvince.id,
          province_name: dataProvince.province_name,
          city_id: dataCity.id,
          city_name: dataCity.city_name,
          created_by: reqBody.user_id
        })

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil diperbaharui'
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle Delete
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleDelete(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        id: 'required'
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`*`)).from('datas').whereRaw(`id = ?`, reqBody.id)
      if(data.length === 0) throw createError('Data not found', 'E_BAD_REQUEST')

      await db('datas').where('id', reqBody.id).del()

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil dihapus'
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

}

export = DataClientController