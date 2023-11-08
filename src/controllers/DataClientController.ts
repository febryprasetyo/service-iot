import { logger, sendResponseCustom, sendResponseError, 
  errorCodes, createError, validateParamsAll, db} from '../utils/util';
import 'dotenv/config';
import bcrypt from "bcrypt";

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
        limit: 'required',
        offset: 'required'
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`
        s.id, s.nama_stasiun, s.id_mesin, s.address,
        s.province_name, s.province_id, s.city_name, s.city_id 
      `)).from('stations AS s')
        .orderBy('s.created_at', 'DESC')
        .limit(reqBody.limit, { skipBinding: true })
        .offset(reqBody.offset)

      let countData = await db.select(db.raw(`COUNT(*) as total`))
        .from('stations')

      return sendResponseCustom(res, {
        success: true,
        data: {
          values: data,
          total: countData.length == 0 ? 0 : countData[0].total
        }
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
        device_id: 'required|number',
        nama_stasiun: 'required',
        nama_dinas: 'required',
        address: 'required',
        province_id: 'required|number',
        city_id: 'required|number',
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

      let dataDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, reqBody.device_id)
      if(dataDevice.length === 0) throw createError(`Device not found`, 'E_BAD_REQUEST')
      dataDevice = dataDevice[0]

      await db('stations')
        .insert({
          device_id: reqBody.device_id,
          nama_stasiun: reqBody.nama_stasiun,
          id_mesin: dataDevice.id_mesin,
          nama_dinas: reqBody.nama_dinas,
          address: reqBody.address,
          province_id: reqBody.province_id,
          province_name: dataProvince.province_name,
          city_id: reqBody.city_id,
          city_name: dataCity.city_name,
          created_by: reqBody.user_id
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
        id: 'required|number',
        device_id: 'required|number',
        nama_stasiun: 'required',
        nama_dinas: 'required',
        address: 'required',
        province_id: 'required|number',
        city_id: 'required|number',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`*`)).from('stations').whereRaw(`id = ?`, reqBody.id)
      if(data.length === 0) throw createError('Station not found', 'E_BAD_REQUEST')

      let dataProvince = await db.select(db.raw(`*`)).from('provinces').whereRaw(`id = ?`, reqBody.province_id)
      if(dataProvince.length === 0) throw createError('Province not found', 'E_BAD_REQUEST')
      dataProvince = dataProvince[0]

      let dataCity = await db.select(db.raw(`*`)).from('cities').whereRaw(`id = ?`, reqBody.city_id)
      if(dataCity.length === 0) throw createError('City not found', 'E_BAD_REQUEST')
      dataCity = dataCity[0]
      if(dataCity.province_id !== dataProvince.id) throw createError(`City ${dataCity.city_name} not found in Province ${dataProvince.province_name}`, 'E_BAD_REQUEST')

      let dataDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, reqBody.device_id)
      if(dataDevice.length === 0) throw createError(`Device not found`, 'E_BAD_REQUEST')
      dataDevice = dataDevice[0]

      await db('stations')
        .whereRaw(`id = ?`, reqBody.id)
        .update({
          device_id: reqBody.device_id,
          nama_stasiun: reqBody.nama_stasiun,
          id_mesin: dataDevice.id_mesin,
          nama_dinas: reqBody.nama_dinas,
          address: reqBody.address,
          province_id: reqBody.province_id,
          province_name: dataProvince.province_name,
          city_id: reqBody.city_id,
          city_name: dataCity.city_name,
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
   * API Handle Delete
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleDelete(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        id: 'required|number'
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`*`)).from('stations').whereRaw(`id = ?`, reqBody.id)
      if(data.length === 0) throw createError('Station not found', 'E_BAD_REQUEST')

      await db('stations').where('id', reqBody.id).del()

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
        // nama_dinas: 'required',
        dinas_id: 'required',
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

      let dataDinas = await db.select(db.raw(`*`)).from('users').whereRaw(`id = ?`, reqBody.dinas_id)
      if(dataDinas.length === 0) throw createError(`Dinas not found`, 'E_BAD_REQUEST')
      dataDinas = dataDinas[0]

      await db('devices')
        .insert({
          id_mesin: reqBody.id_mesin,
          nama_dinas: dataDinas.nama_dinas,
          dinas_id: dataDinas.id,
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
        // nama_dinas: 'required',
        dinas_id: 'required',
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

      let dataDinas = await db.select(db.raw(`*`)).from('users').whereRaw(`id = ?`, reqBody.dinas_id)
      if(dataDinas.length === 0) throw createError(`Dinas not found`, 'E_BAD_REQUEST')
      dataDinas = dataDinas[0]

      await db('devices')
        .whereRaw(`id = ?`, reqBody.id)
        .update({
          id_mesin: reqBody.id_mesin,
          nama_dinas: dataDinas.nama_dinas,
          dinas_id: dataDinas.id,
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
   * API Handle List Device
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

  /**
   * API Handle List Dinas
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleListDinas(req: any, res:any) {
    try {

      let dataDinas = await db.select(db.raw(`distinct id as dinas_id, nama_dinas`))
        .from('users')
        .whereRaw(`nama_dinas notnull`)

      return sendResponseCustom(res, {
        success: true,
        data: dataDinas
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle Create User
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleCreateUser(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        username: 'required',
        password: 'required',
        nama_dinas: 'required',
        api_key: 'required',
        secret_key: 'required',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`*`)).from('users').whereRaw(`username = ?`, reqBody.username.trim())
      if(data.length > 0) throw createError(`User ${reqBody.username} already exists`, 'E_BAD_REQUEST')

      // let dataDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, reqBody.device_id)
      // if(dataDevice.length === 0) throw createError(`Device not found`, 'E_BAD_REQUEST')

      const salt = await bcrypt.genSalt(10)
      reqBody.password = await bcrypt.hash(reqBody.password.trim(), salt)

      await db('users')
        .insert({
          username: reqBody.username.trim(),
          password: reqBody.password,
          nama_dinas: reqBody.nama_dinas,
          api_key: reqBody.api_key.trim(),
          secret_key: reqBody.secret_key.trim(),
          role_id: 'usr',
          created_by: reqBody.user_id,
          is_active: true
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
   * API Handle Create User
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleUpdateUser(req: any, res:any) {
    try {
      let reqBody = req.body

      let rules = {
        id: 'required|number',
        password: 'required',
        // device_id: 'required',
        nama_dinas: 'required',
        api_key: 'required',
        secret_key: 'required',
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
        })

      let data = await db.select(db.raw(`*`)).from('users').whereRaw(`id = ?`, reqBody.id)
      if(data.length === 0) throw createError(`User not found`, 'E_BAD_REQUEST')
      data = data[0]

      const match = await bcrypt.compare(reqBody.password, data.password)

      if (!match) {
        const salt = await bcrypt.genSalt(10)
        reqBody.password = await bcrypt.hash(reqBody.password.trim(), salt)
      }

      // let dataDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, reqBody.device_id)
      // if(dataDevice.length === 0) throw createError(`Device not found`, 'E_BAD_REQUEST')


      await db('users')
        .whereRaw(`id = ?`, reqBody.id)
        .update({
          username: reqBody.username.trim(),
          password: match ? undefined : reqBody.password,
          nama_dinas: reqBody.nama_dinas,
          api_key: reqBody.api_key.trim(),
          secret_key: reqBody.secret_key.trim(),
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
   * API Handle Remove User
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleRemoveUser(req: any, res:any) {
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

      let checkUser = await db.select(db.raw(`*`)).from('users').whereRaw(`id = ?`, [reqBody.id])
      if(checkUser.length === 0) throw createError(`Data user not found`, 'E_BAD_REQUEST')

      await db('users').where('id', reqBody.id).del()

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
  async handleListUser(req: any, res:any) {
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

      let dataUser = await db.select(db.raw(`usr.id, usr.username, usr.api_key, usr.secret_key, COALESCE(dv.nama_dinas, usr.nama_dinas) nama_dinas`))
        .from('users AS usr')
        .leftJoin(db.raw(`devices AS dv on dv.id = usr.device_id`))
        .orderBy('usr.created_at', 'DESC')
        .limit(reqBody.limit, { skipBinding: true })
        .offset(reqBody.offset)

      let countDataUser = await db.select(db.raw(`COUNT(*) as total`))
        .from('users')

      return sendResponseCustom(res, {
        success: true,
        data: {
          values: dataUser,
          total: countDataUser.length == 0 ? 0 : countDataUser[0].total
        }
      })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle List Device
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleListDeviceUser(req: any, res:any) {
    try {

      let data = await db.select(db.raw(`id AS device_id, nama_dinas`))
        .from('devices')

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
   * API Handle List Device
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleDeviceList(req: any, res:any) {
    try {

      let data = await db.select(db.raw(`id AS device_id, nama_dinas, id_mesin`))
        .from('devices')

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

}

export = DataClientController