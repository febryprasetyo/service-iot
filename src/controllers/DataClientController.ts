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

  /**
   * API Handle Create Device
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleCreateDevice(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        id_mesin: 'required',
        nama_dinas: 'required',
        nama_stasiun: 'required',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`*`)).from('devices').whereRaw(`id_mesin = ?`, reqBody.id_mesin)
      if(data.length > 0) throw createError(`Id Mesin ${reqBody.id_mesin} already exists`, 'E_BAD_REQUEST')

      await db('devices')
        .insert({
          id_mesin: reqBody.id_mesin,
          nama_dinas: reqBody.nama_dinas,
          nama_stasiun: reqBody.nama_stasiun,
          created_by: reqBody.user_id,
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
   * API Handle Update Device
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleUpdateDevice(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        id: 'required|number',
        id_mesin: 'required',
        nama_dinas: 'required',
        nama_stasiun: 'required',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let checkDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, [reqBody.id])
      if(checkDevice.length === 0) throw createError(`Data device not found`, 'E_BAD_REQUEST')

      let data = await db.select(db.raw(`*`)).from('devices').whereRaw(`id_mesin = ? AND id NOT IN (?)`, [reqBody.id_mesin, reqBody.id])
      if(data.length > 0) throw createError(`Id Mesin ${reqBody.id_mesin} already exists`, 'E_BAD_REQUEST')

      await db('devices')
        .whereRaw(`id = ?`, reqBody.id)
        .update({
          id_mesin: reqBody.id_mesin,
          nama_dinas: reqBody.nama_dinas,
          nama_stasiun: reqBody.nama_stasiun,
          updated_at: new Date
        })

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil diubah'
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle Remove Device
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleRemoveDevice(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        id: 'required|number',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let checkDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, [reqBody.id])
      if(checkDevice.length === 0) throw createError(`Data device not found`, 'E_BAD_REQUEST')

      await db('devices').where('id', reqBody.id).del()

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

  /**
   * API Handle Remove Device
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleListDevice(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        limit: 'required',
        offset: 'required'
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let dataDevice = await db.select(db.raw(`*`))
        .from('devices')
        .orderBy('created_at', 'DESC')
        .limit(reqBody.limit, { skipBinding: true })
        .offset(reqBody.offset)

      let countDataDevice = await db.select(db.raw(`COUNT(*) as total`))
        .from('devices')

      return sendResponseCustom(res, {
        success: true,
        data: {
          values: dataDevice,
          total: countDataDevice.length == 0 ? 0 : countDataDevice[0].total
        }
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

}

export = DataClientController