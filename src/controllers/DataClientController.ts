import {
  logger,
  sendResponseCustom,
  sendResponseError,
  errorCodes,
  createError,
  validateParamsAll,
  db,
  moment,
  buildPagination
} from '../utils/util';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { start } from 'repl';
import { stringify } from "csv-stringify";
import { pipeline } from "stream";
import QueryStream from "pg-query-stream";
import { Knex } from 'knex';
import { parse } from "fast-csv"; // parser optional kalau butuh transform
import * as fastcsv from "fast-csv";

class DataClientController {
  /**
   * API Handle Province List
   * @param {*} req
   * @author Roby Parlan
   */
  async handleProvinceList(req: any, res: any) {
    try {
      let data = await db.select(db.raw(`*`)).from('provinces');
      return sendResponseCustom(res, {
        success: true,
        data,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle City List
   * @param {*} req
   * @author Roby Parlan
   */
  async handleCityList(req: any, res: any) {
    try {
      let provinceId = req.params.province_id;

      let query = db.select(db.raw(`*`)).from('cities');

      if (provinceId) {
        query = query.whereRaw(`province_id = ?`, provinceId);
      }

      let data = await query;

      return sendResponseCustom(res, {
        success: true,
        data,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Create Role
   * @param {*} req
   * @author Roby Parlan
   */
  async handleCreateRole(req: any, res: any) {
    try {
      let reqBody = req.body;
      let rules = {
        id: 'required|string',
        role_name: 'required|string',
        order_no: 'number',
      };

      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let check = await db.select(db.raw(`id`)).from('roles').whereRaw(`id = ?`, reqBody.id);
      if (check.length > 0) {
        throw createError(`Role ID ${reqBody.id} already exists`, 'E_BAD_REQUEST');
      }

      await db('roles').insert({
        id: reqBody.id.toLowerCase(),
        role_name: reqBody.role_name,
        order_no: reqBody.order_no || 0,
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Role berhasil ditambahkan',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);
      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Role List
   * @param {*} req
   * @author Roby Parlan
   */
  async handleRoleList(req: any, res: any) {
    try {
      let data = await db.select(db.raw(`*`)).from('roles').orderBy('order_no', 'asc');
      return sendResponseCustom(res, {
        success: true,
        data,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle List
   * @param {*} req
   * @author Roby Parlan
   */
  async handleList(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        limit: 'required',
        offset: 'required',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let query = db
        .select(
          db.raw(`
        s.id, s.nama_stasiun, s.id_mesin, s.address,
        s.province_name, s.province_id, s.city_name, s.city_id, s.coordinate
      `)
        )
        .from('stations AS s');

      let queryData = db
        .select(db.raw(`COUNT(s.*) as total`))
        .from('stations AS s');

      if (req.body.role_id === 'usr') {
        query = query.leftJoin(db.raw(`devices d on d.id_mesin = s.id_mesin`));
        query = query.leftJoin(db.raw(`users u on d.dinas_id = u.id`));
        query = query.whereRaw(`u.id = ?`, req.body.user_id);

        queryData = queryData.leftJoin(
          db.raw(`devices d on d.id_mesin = s.id_mesin`)
        );
        queryData = queryData.leftJoin(db.raw(`users u on d.dinas_id = u.id`));
        queryData = queryData.whereRaw(`u.id = ?`, req.body.user_id);
      }

      let data = await query
        .orderBy('s.created_at', 'DESC')
        .limit(reqBody.limit, { skipBinding: true })
        .offset(reqBody.offset);

      let countData = await queryData;

      return sendResponseCustom(res, {
        success: true,
        data: {
          values: data,
          total: countData.length == 0 ? 0 : countData[0].total,
        },
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Create
   * @param {*} req
   * @author Roby Parlan
   */
  async handleCreate(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        device_id: 'required|number',
        nama_stasiun: 'required',
        nama_dinas: 'required',
        address: 'required',
        coordinate: 'required',
        province_id: 'required|number',
        city_id: 'required|number',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let dataProvince = await db
        .select(db.raw(`*`))
        .from('provinces')
        .whereRaw(`id = ?`, reqBody.province_id);
      if (dataProvince.length === 0)
        throw createError('Province not found', 'E_BAD_REQUEST');
      dataProvince = dataProvince[0];

      let dataCity = await db
        .select(db.raw(`*`))
        .from('cities')
        .whereRaw(`id = ?`, reqBody.city_id);
      if (dataCity.length === 0)
        throw createError('City not found', 'E_BAD_REQUEST');
      dataCity = dataCity[0];
      if (dataCity.province_id !== dataProvince.id)
        throw createError(
          `City ${dataCity.city_name} not found in Province ${dataProvince.province_name}`,
          'E_BAD_REQUEST'
        );

      let dataDevice = await db
        .select(db.raw(`*`))
        .from('devices')
        .whereRaw(`id = ?`, reqBody.device_id);
      if (dataDevice.length === 0)
        throw createError(`Device not found`, 'E_BAD_REQUEST');
      dataDevice = dataDevice[0];

      await db('stations').insert({
        device_id: reqBody.device_id,
        nama_stasiun: reqBody.nama_stasiun,
        id_mesin: dataDevice.id_mesin,
        nama_dinas: reqBody.nama_dinas,
        address: reqBody.address,
        province_id: reqBody.province_id,
        province_name: dataProvince.province_name,
        city_id: reqBody.city_id,
        city_name: dataCity.city_name,
        coordinate: reqBody.coordinate,
        created_by: reqBody.user_id,
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil disimpan',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Update
   * @param {*} req
   * @author Roby Parlan
   */
  async handleUpdate(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        id: 'required|number',
        device_id: 'required|number',
        nama_stasiun: 'required',
        nama_dinas: 'required',
        address: 'required',
        coordinate: 'required',
        province_id: 'required|number',
        city_id: 'required|number',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let data = await db
        .select(db.raw(`*`))
        .from('stations')
        .whereRaw(`id = ?`, reqBody.id);
      if (data.length === 0)
        throw createError('Station not found', 'E_BAD_REQUEST');

      let dataProvince = await db
        .select(db.raw(`*`))
        .from('provinces')
        .whereRaw(`id = ?`, reqBody.province_id);
      if (dataProvince.length === 0)
        throw createError('Province not found', 'E_BAD_REQUEST');
      dataProvince = dataProvince[0];

      let dataCity = await db
        .select(db.raw(`*`))
        .from('cities')
        .whereRaw(`id = ?`, reqBody.city_id);
      if (dataCity.length === 0)
        throw createError('City not found', 'E_BAD_REQUEST');
      dataCity = dataCity[0];
      if (dataCity.province_id !== dataProvince.id)
        throw createError(
          `City ${dataCity.city_name} not found in Province ${dataProvince.province_name}`,
          'E_BAD_REQUEST'
        );

      let dataDevice = await db
        .select(db.raw(`*`))
        .from('devices')
        .whereRaw(`id = ?`, reqBody.device_id);
      if (dataDevice.length === 0)
        throw createError(`Device not found`, 'E_BAD_REQUEST');
      dataDevice = dataDevice[0];

      await db('stations').whereRaw(`id = ?`, reqBody.id).update({
        device_id: reqBody.device_id,
        nama_stasiun: reqBody.nama_stasiun,
        id_mesin: dataDevice.id_mesin,
        nama_dinas: reqBody.nama_dinas,
        address: reqBody.address,
        province_id: reqBody.province_id,
        province_name: dataProvince.province_name,
        city_id: reqBody.city_id,
        city_name: dataCity.city_name,
        coordinate: reqBody.coordinate,
        updated_at: new Date(),
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil diubah',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Delete
   * @param {*} req
   * @author Roby Parlan
   */
  async handleDelete(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        id: 'required|number',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let data = await db
        .select(db.raw(`*`))
        .from('stations')
        .whereRaw(`id = ?`, reqBody.id);
      if (data.length === 0)
        throw createError('Station not found', 'E_BAD_REQUEST');

      await db('stations').where('id', reqBody.id).del();

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil dihapus',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Create Device
   * @param {*} req
   * @author Roby Parlan
   */
  async handleCreateDevice(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        id_mesin: 'required',
        // nama_dinas: 'required',
        dinas_id: 'required',
        nama_stasiun: 'required',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      // let data = await db.select(db.raw(`*`)).from('devices').whereRaw(`id_mesin = ?`, reqBody.id_mesin)
      // if(data.length > 0) throw createError(`Id Mesin ${reqBody.id_mesin} already exists`, 'E_BAD_REQUEST')

      let dataDinas = await db
        .select(db.raw(`*`))
        .from('users')
        .whereRaw(`id = ?`, reqBody.dinas_id);
      if (dataDinas.length === 0)
        throw createError(`Dinas not found`, 'E_BAD_REQUEST');
      dataDinas = dataDinas[0];

      await db('devices').insert({
        id_mesin: reqBody.id_mesin,
        nama_dinas: dataDinas.nama_dinas,
        dinas_id: dataDinas.id,
        nama_stasiun: reqBody.nama_stasiun,
        created_by: reqBody.user_id,
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil disimpan',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Update Device
   * @param {*} req
   * @author Roby Parlan
   */
  async handleUpdateDevice(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        id: 'required|number',
        id_mesin: 'required',
        // nama_dinas: 'required',
        dinas_id: 'required',
        nama_stasiun: 'required',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let checkDevice = await db
        .select(db.raw(`*`))
        .from('devices')
        .whereRaw(`id = ?`, [reqBody.id]);
      if (checkDevice.length === 0)
        throw createError(`Data device not found`, 'E_BAD_REQUEST');

      // let data = await db.select(db.raw(`*`)).from('devices').whereRaw(`id_mesin = ? AND id NOT IN (?)`, [reqBody.id_mesin, reqBody.id])
      // if(data.length > 0) throw createError(`Id Mesin ${reqBody.id_mesin} already exists`, 'E_BAD_REQUEST')

      let dataDinas = await db
        .select(db.raw(`*`))
        .from('users')
        .whereRaw(`id = ?`, reqBody.dinas_id);
      if (dataDinas.length === 0)
        throw createError(`Dinas not found`, 'E_BAD_REQUEST');
      dataDinas = dataDinas[0];

      await db('devices').whereRaw(`id = ?`, reqBody.id).update({
        id_mesin: reqBody.id_mesin,
        nama_dinas: dataDinas.nama_dinas,
        dinas_id: dataDinas.id,
        nama_stasiun: reqBody.nama_stasiun,
        updated_at: new Date(),
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil diubah',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Remove Device
   * @param {*} req
   * @author Roby Parlan
   */
  async handleRemoveDevice(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        id: 'required|number',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let checkDevice = await db
        .select(db.raw(`*`))
        .from('devices')
        .whereRaw(`id = ?`, [reqBody.id]);
      if (checkDevice.length === 0)
        throw createError(`Data device not found`, 'E_BAD_REQUEST');

      await db('devices').where('id', reqBody.id).del();

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil dihapus',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle List Device
   * @param {*} req
   * @author Roby Parlan
   */
  async handleListDevice(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        limit: 'required',
        offset: 'required',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let dataDevice = await db
        .select(db.raw(`*`))
        .from('devices')
        .orderBy('created_at', 'DESC')
        .limit(reqBody.limit, { skipBinding: true })
        .offset(reqBody.offset);

      let countDataDevice = await db
        .select(db.raw(`COUNT(*) as total`))
        .from('devices');

      return sendResponseCustom(res, {
        success: true,
        data: {
          values: dataDevice,
          total: countDataDevice.length == 0 ? 0 : countDataDevice[0].total,
        },
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle List Dinas
   * @param {*} req
   * @author Roby Parlan
   */
  async handleListDinas(req: any, res: any) {
    try {
      let dataDinas = await db
        .select(db.raw(`distinct id as dinas_id, nama_dinas`))
        .from('users')
        .whereRaw(`nama_dinas notnull`);

      return sendResponseCustom(res, {
        success: true,
        data: dataDinas,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Create User
   * @param {*} req
   * @author Roby Parlan
   */
  async handleCreateUser(req: any, res: any) {
    try {
      let reqBody = req.body;

      let roleId = String(reqBody.role_id || 'usr').trim().toLowerCase();
      let requiresCredentials = roleId === 'usr';

      let rules: any = {
        username: 'required',
        password: 'required',
        nama_dinas: 'required',
        role_id: 'string',
      };

      if (!requiresCredentials) {
        rules.api_key = 'string';
        rules.secret_key = 'string';
      } else {
        rules.api_key = 'required';
        rules.secret_key = 'required';
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });
      
      // Validate role exists
      let roleCheck = await db.select(db.raw(`id`)).from('roles').whereRaw(`id = ?`, roleId);
      if (roleCheck.length === 0) {
        throw createError(`Role ${roleId} not found`, 'E_BAD_REQUEST');
      }

      let data = await db
        .select(db.raw(`*`))
        .from('users')
        .whereRaw(`username = ?`, reqBody.username.trim());
      if (data.length > 0)
        throw createError(
          `User ${reqBody.username} already exists`,
          'E_BAD_REQUEST'
        );

      // let dataDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, reqBody.device_id)
      // if(dataDevice.length === 0) throw createError(`Device not found`, 'E_BAD_REQUEST')

      const salt = await bcrypt.genSalt(10);
      reqBody.password = await bcrypt.hash(reqBody.password.trim(), salt);

      await db('users').insert({
        username: reqBody.username.trim(),
        password: reqBody.password,
        nama_dinas: reqBody.nama_dinas,
        api_key: reqBody.api_key ? reqBody.api_key.trim() : '',
        secret_key: reqBody.secret_key ? reqBody.secret_key.trim() : '',
        role_id: roleId,
        created_by: reqBody.user_id,
        is_active: true,
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil disimpan',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Create User
   * @param {*} req
   * @author Roby Parlan
   */
  async handleUpdateUser(req: any, res: any) {
    try {
      let reqBody = req.body;

      if (!reqBody.id) {
        throw createError('ID is required', 'E_BAD_REQUEST');
      }

      let data = await db
        .select(db.raw(`*`))
        .from('users')
        .whereRaw(`id = ?`, reqBody.id);
      
      if (data.length === 0) {
        throw createError(`User not found`, 'E_BAD_REQUEST');
      }
      data = data[0];

      let roleId = String(reqBody.role_id || data.role_id).trim().toLowerCase();
      let requiresCredentials = roleId === 'usr';

      let rules: any = {
        id: 'required|number',
        password: 'required',
        nama_dinas: 'required',
        role_id: 'string',
      };

      if (!requiresCredentials) {
        rules.api_key = 'string';
        rules.secret_key = 'string';
      } else {
        rules.api_key = 'required';
        rules.secret_key = 'required';
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      if (reqBody.role_id) {
        let roleCheck = await db.select(db.raw(`id`)).from('roles').whereRaw(`id = ?`, reqBody.role_id);
        if (roleCheck.length === 0) {
          throw createError(`Role ${reqBody.role_id} not found`, 'E_BAD_REQUEST');
        }
      }

      const match = await bcrypt.compare(reqBody.password, data.password);

      if (!match) {
        const salt = await bcrypt.genSalt(10);
        reqBody.password = await bcrypt.hash(reqBody.password.trim(), salt);
      }

      // let dataDevice = await db.select(db.raw(`*`)).from('devices').whereRaw(`id = ?`, reqBody.device_id)
      // if(dataDevice.length === 0) throw createError(`Device not found`, 'E_BAD_REQUEST')

      let deviceId =
        !reqBody.device_id || reqBody.device_id == ''
          ? undefined
          : reqBody.device_id;

        await db('users')
        .whereRaw(`id = ?`, reqBody.id)
        .update({
          username: reqBody.username.trim(),
          password: match ? undefined : reqBody.password,
          nama_dinas: reqBody.nama_dinas,
          device_id: deviceId,
          api_key: reqBody.api_key ? reqBody.api_key.trim() : '',
          secret_key: reqBody.secret_key ? reqBody.secret_key.trim() : '',
          role_id: reqBody.role_id ? String(reqBody.role_id).trim().toLowerCase() : data.role_id,
          updated_at: new Date(),
        });

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil diubah',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Remove User
   * @param {*} req
   * @author Roby Parlan
   */
  async handleRemoveUser(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        id: 'required|number',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let checkUser = await db
        .select(db.raw(`*`))
        .from('users')
        .whereRaw(`id = ?`, [reqBody.id]);
      if (checkUser.length === 0)
        throw createError(`Data user not found`, 'E_BAD_REQUEST');

      await db('users').where('id', reqBody.id).del();

      return sendResponseCustom(res, {
        success: true,
        message: 'Data berhasil dihapus',
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Remove Device
   * @param {*} req
   * @author Roby Parlan
   */
  async handleListUser(req: any, res: any) {
    try {
      let reqBody = req.body;

      let rules = {
        limit: 'required',
        offset: 'required',
      };

      // Validate the request params
      await validateParamsAll(reqBody, rules).catch((err) => {
        delete err.failed;
        throw createError(err.message_id || err.message_en, 'E_BAD_REQUEST', err);
      });

      let dataUser = await db
        .select(
          db.raw(
            `usr.id, usr.username, usr.api_key, usr.secret_key, usr.role_id, COALESCE(dv.nama_dinas, usr.nama_dinas) nama_dinas`
          )
        )
        .from('users AS usr')
        .leftJoin(db.raw(`devices AS dv on dv.id = usr.device_id`))
        .whereRaw(`usr.role_id != ?`, ['adm'])
        .orderBy('usr.created_at', 'DESC')
        .limit(reqBody.limit, { skipBinding: true })
        .offset(reqBody.offset);

      let countDataUser = await db
        .select(db.raw(`COUNT(*) as total`))
        .from('users')
        .whereRaw(`role_id != ?`, ['adm']);

      // Grouping berdasarkan role_id
      const groupedData = {
        user: [] as any[],
        engineering: [] as any[],
      };

      dataUser.forEach((user: any) => {
        const { role_id, ...userData } = user;

        if (role_id === 'usr') {
          groupedData.user.push({ ...userData, role_id: 'usr' });
        } else if (role_id === 'eng') {
          groupedData.engineering.push({ ...userData, role_id: 'eng' });
        }
      });

      return sendResponseCustom(res, {
        success: true,
        data: {
          user: groupedData.user,
          engineering: groupedData.engineering,
          total: countDataUser.length == 0 ? 0 : countDataUser[0].total,
        },
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle List Device
   * @param {*} req
   * @author Roby Parlan
   */
  async handleListDeviceUser(req: any, res: any) {
    try {
      let data = await db
        .select(db.raw(`id AS device_id, nama_dinas`))
        .from('devices');

      return sendResponseCustom(res, {
        success: true,
        data,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle List Device
   * @param {*} req
   * @author Roby Parlan
   */
  async handleDeviceList(req: any, res: any) {
    try {
      let query = db
        .select(db.raw(`d.id AS device_id, d.nama_dinas, d.id_mesin`))
        .from('devices AS d');

      if (req.body.role_id === 'usr') {
        query = query.leftJoin(db.raw(`users u on u.id = d.dinas_id`));
        query = query.whereRaw(`u.id = ?`, req.body.user_id);
      }

      let data = await query;

      return sendResponseCustom(res, {
        success: true,
        data,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle List Response KLHK
   * @param {*} req
   * @author Roby Parlan
   */
  async handleKlhkList(req: any, res: any) {
    try {
      let limit = req.query.limit ? req.query.limit : 10;
      let offset = req.query.offset ? req.query.offset : 0;
      let startDate = req.query.startDate ? req.query.startDate : null;
      let endDate = req.query.endDate ? req.query.endDate : null;
      let startHour = req.query.startHour ? req.query.startHour : null;
      let endHour = req.query.endHour ? req.query.endHour : null;
      let namaStasiun = req.query.namaStasiun ? req.query.namaStasiun : null;

      let query = db
        .select(
          db.raw(`
        ROW_NUMBER() OVER (ORDER BY rk.id DESC) AS number,
        rk.payload, rk.data_uid, rk.status_code, rk.status_desc, rk.id_stasiun`)
        )
        .from('res_klhk AS rk')
        .leftJoin(
          db.raw(`devices s on upper(s.nama_stasiun) = upper(rk.id_stasiun)`)
        )
        .whereRaw(`rk.payload IS JSON`) // Filter only valid JSON
        .limit(parseInt(limit), { skipBinding: true })
        .offset(
          parseInt(offset) === 0
            ? parseInt(offset)
            : parseInt(limit) * parseInt(offset)
        )
        .orderByRaw(
          `CASE WHEN rk.payload IS JSON THEN ((rk.payload::jsonb->'data'->>'Tanggal'::text) || ' ' || (rk.payload::jsonb->'data'->>'Jam'::text)) ELSE NULL END DESC`
        );

      let qt = db
        .select(db.raw(`count(rk.*)`))
        .from('res_klhk AS rk')
        .leftJoin(
          db.raw(`devices s on upper(s.nama_stasiun) = upper(rk.id_stasiun)`)
        )
        .whereRaw(`rk.payload IS JSON`);

      if (req.body.role_id === 'usr') {
        query = query.leftJoin(db.raw(`users u on u.id = s.dinas_id`));
        qt = qt.leftJoin(db.raw(`users u on u.id = s.dinas_id`));
        query = query.whereRaw(`u.id = ?`, req.body.user_id);
        qt = qt.whereRaw(`u.id = ?`, req.body.user_id);
      }

      if (startDate && endDate) {
        const datePath = `CASE WHEN rk.payload IS JSON THEN ((rk.payload::jsonb->'data'->>'Tanggal'::text) || ' ' || (rk.payload::jsonb->'data'->>'Jam'::text)) ELSE NULL END`;
        query = query.whereRaw(
          `${datePath} between ? and ?`,
          [
            startDate + ' ' + (startHour || '00:00:00'),
            endDate + ' ' + (endHour || '00:00:00'),
          ]
        );
        qt = qt.whereRaw(
          `${datePath} between ? and ?`,
          [
            startDate + ' ' + (startHour || '00:00:00'),
            endDate + ' ' + (endHour || '00:00:00'),
          ]
        );
      }

      if (namaStasiun) {
        query = query.whereRaw(`s.nama_stasiun ILIKE ?`, `%${namaStasiun}%`);
        qt = qt.whereRaw(`s.nama_stasiun ILIKE ?`, `%${namaStasiun}%`);
      }

      logger.info(query.toString());

      let data = await query;

      let totalData = await qt;

      data.forEach((item: any) => {
        item.payload = JSON.parse(item.payload);
      });

      data.forEach((item: any) => {
        item.payload = JSON.stringify(item.payload);
      });

      return sendResponseCustom(res, {
        success: true,
        totalData: totalData[0].count,
        data,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle Export excel Response KLHK
   * @param {*} req
   * @author Roby Parlan
   */
  async handleKlhkExport(req: any, res: any) {
    try {
      let startDate = req.query.startDate ? req.query.startDate : null;
      let endDate = req.query.endDate ? req.query.endDate : null;
      let startHour = req.query.startHour ? req.query.startHour : null;
      let endHour = req.query.endHour ? req.query.endHour : null;
      let namaStasiun = req.query.namaStasiun ? req.query.namaStasiun : null;

      let query = db
        .select(db.raw(`rk.*`))
        .from('res_klhk AS rk')
        .leftJoin(
          db.raw(`devices s on upper(s.nama_stasiun) = upper(rk.id_stasiun)`)
        )
        .whereRaw(`rk.payload IS JSON`) // Ensure only valid JSON is processed
        .orderByRaw(
          `CASE WHEN rk.payload IS JSON THEN ((rk.payload::jsonb->'data'->>'Tanggal'::text) || ' ' || (rk.payload::jsonb->'data'->>'Jam'::text)) ELSE NULL END DESC`
        );

      if (req.body.role_id === 'usr') {
        query = query.leftJoin(db.raw(`users u on u.id = s.dinas_id`));
        query = query.whereRaw(`u.id = ?`, req.body.user_id);
      }

      if (startDate && endDate) {
        const datePath = `CASE WHEN rk.payload IS JSON THEN ((rk.payload::jsonb->'data'->>'Tanggal'::text) || ' ' || (rk.payload::jsonb->'data'->>'Jam'::text)) ELSE NULL END`;
        query = query.whereRaw(
          `${datePath} between ? and ?`,
          [
            startDate + ' ' + (startHour || '00:00:00'),
            endDate + ' ' + (endHour || '00:00:00'),
          ]
        );
      }

      if (namaStasiun) {
        query = query.whereRaw(`s.nama_stasiun ILIKE ?`, `%${namaStasiun}%`);
      }

      let data = await query;

      data.forEach((item: any) => {
        item.payload = JSON.parse(item.payload);
      });

      let ctxData: any = [];
      data.forEach((item: any, idx: any) => {
        // item.payload = JSON.stringify(item.payload)
        item.number = idx + 1;
        ctxData.push({ number: item.number, ...item.payload.data });
      });
      logger.info(`--------------------------- ctxData : `, ctxData);

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Data');

      const headers = [
        { header: 'No', key: 'number' },
        { header: 'Id Stasiun', key: 'IDStasiun' },
        { header: 'Tanggal', key: 'Tanggal' },
        { header: 'Jam', key: 'Jam' },
        { header: 'DO', key: 'DO' },
        { header: 'PH', key: 'PH' },
        { header: 'BOD', key: 'BOD' },
        { header: 'COD', key: 'COD' },
        // { header: 'DHL', key: 'DHL' },
        // { header: 'ORP', key: 'ORP' },
        { header: 'TDS', key: 'TDS' },
        { header: 'TSS', key: 'TSS' },
        { header: 'Suhu', key: 'Suhu' },
        // { header: 'SwSG', key: 'SwSG' },
        { header: 'Nitrat', key: 'Nitrat' },
        { header: 'Amonia', key: 'Amonia' },
        { header: 'Kedalaman', key: 'Kedalaman' },
        // { header: 'Salinitas', key: 'Salinitas' },
        { header: 'Turbidity', key: 'Turbidity' },
      ];

      sheet.columns = headers;

      // Add custom headers to the worksheet
      headers.forEach((header) => {
        const column = sheet.getColumn(header.key);
        column.header = header.header;
        column.eachCell((cell) => {
          // Example of setting cell style (modify as needed)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '95B3D7' },
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        });
      });

      ctxData.forEach((item: any) => {
        const row = {
          number: item.number,
          DO: item.DO,
          PH: item.PH,
          BOD: item.BOD,
          COD: item.COD,
          // "DHL": item.DHL || 0,
          Jam: item.Jam,
          // "ORP": item.ORP || 0,
          TDS: item.TDS,
          TSS: item.TSS,
          Suhu: item.Suhu,
          // "SwSG": item.SwSG || 0,
          Nitrat: item.Nitrat,
          Amonia: item.Amonia,
          Tanggal: item.Tanggal,
          IDStasiun: item.IDStasiun,
          Kedalaman: item.Kedalaman,
          // "Salinitas": item.Salinitas || 0,
          Turbidity: item.Turbidity,
        };
        sheet.addRow(row);
      });

      /* generate buffer */
      const excelBuffer = await workbook.xlsx.writeBuffer();

      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      const filename = `data_integrasi_${moment().format('YYYYMMDDHHmmsss')}.xlsx`;
      res.header('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(excelBuffer);
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);

      return sendResponseError(res, error);
    }
  }

  /**
   * API Handle List Response KLHK
   * @param {*} req
   * @author Roby Parlan
   */
  // async handleMqttList(req: any, res: any) {
  //     try {
  //       let limit = req.query.limit ? req.query.limit : 100;
  //       let offset = req.query.offset ? req.query.offset : 0;
  //       let startDate = req.query.startDate
  //         ? moment(req.query.startDate).format('YYYY-MM-DD')
  //         : null;
  //       let endDate = req.query.endDate
  //         ? moment(req.query.endDate).format('YYYY-MM-DD')
  //         : null;
  //       let startHour = req.query.startHour ? req.query.startHour : null;
  //       let endHour = req.query.endHour ? req.query.endHour : null;
  //       let namaStasiun = req.query.namaStasiun ? req.query.namaStasiun : null;

  //       let query = db
  //         .select(
  //           db.raw(`
  //         ROW_NUMBER() OVER (ORDER BY md.time DESC) AS number,
  //         d.nama_stasiun, md.*`)
  //         )
  //         .from('mqtt_datas AS md')
  //         .leftJoin(db.raw(`devices AS d on d.id_mesin = md."uuid"`))
  //         .orderByRaw(`md.time DESC`)
  //         .limit(parseInt(limit), { skipBinding: true })
  //         .offset(
  //           parseInt(offset) === 0
  //             ? parseInt(offset)
  //             : parseInt(limit) * parseInt(offset)
  //         );

  //       let qt = db
  //         .select(db.raw(`count(md.*)`))
  //         .from('mqtt_datas AS md')
  //         .leftJoin(db.raw(`devices AS d on d.id_mesin = md."uuid"`));

  //       if (startDate && endDate) {
  //         query = query.whereRaw(
  //           `(to_char(time, 'YYYY-MM-DD')::text || ' '|| to_char(time, 'hh:mm:ss')::text) BETWEEN ? AND ?`,
  //           [
  //             startDate + ' ' + (startHour || '00:00:00'),
  //             endDate + ' ' + (endHour || '00:00:00'),
  //           ]
  //         );
  //         qt = qt.whereRaw(
  //           `(to_char(time, 'YYYY-MM-DD')::text || ' '|| to_char(time, 'hh:mm:ss')::text) BETWEEN ? AND ?`,
  //           [
  //             startDate + ' ' + (startHour || '00:00:00'),
  //             endDate + ' ' + (endHour || '00:00:00'),
  //           ]
  //         );
  //       }

  //       if (req.body.role_id !== 'adm') {
  //         query = query.leftJoin(db.raw(`users u on u.device_id = d.id`));
  //         qt = qt.leftJoin(db.raw(`users u on u.device_id = d.id`));
  //         query = query.whereRaw(`u.id = ?`, req.body.user_id);
  //         qt = qt.whereRaw(`u.id = ?`, req.body.user_id);
  //       }

  //       if (namaStasiun) {
  //         query = query.whereRaw(`d.nama_stasiun ILIKE ?`, `%${namaStasiun}%`);
  //         qt = qt.whereRaw(`d.nama_stasiun ILIKE ?`, `%${namaStasiun}%`);
  //       }

  //       let data = await query;
  //       let totalData = await qt;

  //       return sendResponseCustom(res, {
  //         success: true,
  //         totalData: totalData[0].count,
  //         data,
  //       });
  //     } catch (error: any) {
  //       if (!errorCodes[error.code]) logger.error(error);

  //       return sendResponseError(res, error);
  //     }
  //   }

  async handleMqttList(req: any, res: any) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const startDate = req.query.startDate
        ? moment(req.query.startDate as string).format("YYYY-MM-DD")
        : null;
      const endDate = req.query.endDate
        ? moment(req.query.endDate as string).format("YYYY-MM-DD")
        : null;
      const startHour = (req.query.startHour as string) || "00:00:00";
      const endHour = (req.query.endHour as string) || "23:59:59";
      const namaStasiun = (req.query.namaStasiun as string) || null;

      // sort
      const sortBy = (req.query.sortBy as string) || "time_ts";
      const sortOrder =
        (req.query.sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc";

      // base select (tanpa join devices)
      const buildBaseSelect = (table: string) =>
        db
          .select(
            "id",
            "uuid",
            db.raw("time as time_ts"),
            db.raw("to_char(time, 'YYYY-MM-DD HH24:MI:SS') as time"),
            "temperature",
            db.raw('do_ as "DO"'),
            db.raw('tur as "TUR"'),
            db.raw('ct as "TDS"'),
            db.raw('ph as "PH"'),
            db.raw('orp as "ORP"'),
            db.raw('bod as "BOD"'),
            db.raw('cod as "COD"'),
            db.raw('tss as "TSS"'),
            db.raw('n as "Amonia"'),
            db.raw('no3_3 as "NO3"'),
            db.raw('no2 as "NO32"'),
            db.raw('depth as "Depth"'),
            "id_stasiun"
          )
          .from(table);

      // union subquery
      const buildUnionSub = () =>
        db.from((qb: Knex.QueryBuilder) => {
          qb.unionAll([buildBaseSelect("mqtt_datas"), buildBaseSelect("mqtt_datas_archive")], true).as("md");
        });

      // query utama
      let query = db
        .select(
          db.raw(`
            ROW_NUMBER() OVER (ORDER BY md.${sortBy} ${sortOrder}) AS number,
            COALESCE(d.nama_stasiun, md.id_stasiun) as nama_stasiun,
            md.*
          `)
        )
        .from(buildUnionSub().as("md"))
        .leftJoin("devices as d", "d.id_mesin", "md.uuid")
        .limit(limit)
        .offset(offset === 0 ? 0 : limit * offset);

      // query count
      let qt = db
        .count("* as count")
        .from(buildUnionSub().as("md"))
        .leftJoin("devices as d", "d.id_mesin", "md.uuid");

      // filter tanggal
      if (startDate && endDate) {
        const startTs = `${startDate} ${startHour}`;
        const endTs = `${endDate} ${endHour}`;
        query = query.whereBetween("md.time_ts", [startTs, endTs]);
        qt = qt.whereBetween("md.time_ts", [startTs, endTs]);
      }

      // filter role user
      if (req.body.role_id === "usr") {
        query = query
          .leftJoin({ u: "users" }, "u.device_id", "d.id")
          .where("u.id", req.body.user_id);

        qt = qt
          .leftJoin({ u: "users" }, "u.device_id", "d.id")
          .where("u.id", req.body.user_id);
      }

      // filter nama stasiun
      if (namaStasiun) {
        query = query.whereRaw("d.nama_stasiun ILIKE ?", [`%${namaStasiun}%`]);
        qt = qt.whereRaw("d.nama_stasiun ILIKE ?", [`%${namaStasiun}%`]);
      }

      logger.info(query.toString());

      const data = await query;
      const totalData = parseInt((await qt)[0].count, 10);
      const totalPages = Math.ceil(totalData / limit);
      const pagination = buildPagination(page, totalPages);

      return sendResponseCustom(res, {
        success: true,
        page,
        limit,
        totalData,
        totalPages,
        pagination,
        data,
      });
    } catch (error: any) {
      if (!errorCodes[error.code]) logger.error(error);
      return sendResponseError(res, error);
    }
  }


  /**
   * API Handle List Response MQTT
   * @param {*} req
   * @author Roby Parlan
   */
  // async handleMqttExport(req: any, res: any) {
  //   try {
  //     let startDate = req.query.startDate
  //       ? moment(req.query.startDate).format('YYYY-MM-DD')
  //       : null;
  //     let endDate = req.query.endDate
  //       ? moment(req.query.endDate).format('YYYY-MM-DD')
  //       : null;
  //     let startHour = req.query.startHour ? req.query.startHour : null;
  //     let endHour = req.query.endHour ? req.query.endHour : null;
  //     let namaStasiun = req.query.namaStasiun ? req.query.namaStasiun : null;

  //     let query = db
  //       .select(db.raw(`md.*`))
  //       .from('mqtt_datas AS md')
  //       .leftJoin(db.raw(`devices AS d on d.id_mesin = md."uuid"`))
  //       .orderByRaw(`md.time DESC`);

  //     if (startDate && endDate) {
  //       query = query.whereRaw(
  //         `(to_char(time, 'YYYY-MM-DD')::text || ' '|| to_char(time, 'hh:mm:ss')::text) BETWEEN ? AND ?`,
  //         [
  //           startDate + ' ' + (startHour || '00:00:00'),
  //           endDate + ' ' + (endHour || '00:00:00'),
  //         ]
  //       );
  //     }

  //     if (req.body.role_id !== 'adm') {
  //       query = query.leftJoin(db.raw(`users u on u.device_id = d.id`));
  //       query = query.whereRaw(`u.id = ?`, req.body.user_id);
  //     }

  //     if (namaStasiun) {
  //       query = query.whereRaw(`d.nama_stasiun ILIKE ?`, `%${namaStasiun}%`);
  //     }

  //     let data = await query;

  //     data.forEach((item: any, idx: any) => {
  //       item.number = idx + 1;
  //       item.time = moment(item.time).format('YYYY-MM-DD HH:mm:ss');
  //     });

  //     // Create a new workbook
  //     const workbook = new ExcelJS.Workbook();
  //     const sheet = workbook.addWorksheet('Data');

  //     const headers = [
  //       { header: 'No', key: 'number' },
  //       { header: 'UUID', key: 'uuid' },
  //       { header: 'Time', key: 'time' },
  //       { header: 'Suhu', key: 'temperature' },
  //       { header: 'DO', key: 'do_' },
  //       { header: 'Turbidity', key: 'tur' },
  //       { header: 'TDS', key: 'ct' },
  //       { header: 'PH', key: 'ph' },
  //       { header: 'ORP', key: 'orp' },
  //       { header: 'BOD', key: 'bod' },
  //       { header: 'COD', key: 'cod' },
  //       { header: 'TSS', key: 'tss' },
  //       { header: 'Amonia', key: 'n' },
  //       { header: 'Nitrat', key: 'no3_3' },
  //       { header: 'Nitrit', key: 'no2' },
  //       { header: 'Kedalaman', key: 'depth' },
  //       // { header: 'LGNH4', key: 'lgnh4' },
  //       // { header: 'LIQUID', key: 'liquid' },
  //     ];

  //     sheet.columns = headers;

  //     // Add custom headers to the worksheet
  //     headers.forEach((header) => {
  //       const column = sheet.getColumn(header.key);
  //       column.header = header.header;
  //       column.eachCell((cell) => {
  //         // Example of setting cell style (modify as needed)
  //         cell.fill = {
  //           type: 'pattern',
  //           pattern: 'solid',
  //           fgColor: { argb: '95B3D7' },
  //         };
  //         cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  //       });
  //     });

  //     data.forEach((item: any) => {
  //       const row = {
  //         number: item.number,
  //         uuid: item.uuid,
  //         time: item.time,
  //         temperature: item.temperature,
  //         do_: item.do_,
  //         tur: item.tur,
  //         ct: item.ct,
  //         ph: item.ph,
  //         orp: item.orp,
  //         bod: item.bod,
  //         cod: item.cod,
  //         tss: item.tss,
  //         n: item.n,
  //         no3_3: item.no3_3,
  //         no2: item.no2,
  //         depth: item.depth,
  //         // lgnh4: item.lgnh4,
  //         // liquid: item.liquid,
  //       };
  //       sheet.addRow(row);
  //     });

  //     /* generate buffer */
  //     const excelBuffer = await workbook.xlsx.writeBuffer();

  //     res.header(
  //       'Content-Type',
  //       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  //     );
  //     const filename = `mqtt_${moment().format('YYYYMMDDHHmmsss')}.xlsx`;
  //     res.header('Content-Disposition', `attachment; filename="${filename}"`);
  //     return res.status(200).send(excelBuffer);
  //   } catch (error: any) {
  //     if (!errorCodes[error.code]) logger.error(error);

  //     return sendResponseError(res, error);
  //   }
  // }



  async handleMqttDataList(req: any, res: any) {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    try {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="mqtt_data_export.csv"`
      );

      // gabungkan query dari kedua tabel
      const query = db("mqtt_datas")
        .select("*")
        .whereBetween("created_at", [startDate, endDate])
        .unionAll((qb: { select: (arg0: string) => { (): any; new(): any; from: { (arg0: string): { (): any; new(): any; whereBetween: { (arg0: string, arg1: any[]): void; new(): any; }; }; new(): any; }; }; }) => {
          qb.select("*")
            .from("mqtt_datas_archive")
            .whereBetween("created_at", [startDate, endDate]);
        })
        .orderBy("created_at", "asc");

      // stream hasil query
      const queryStream = query.stream();
      const csvStream = stringify({ header: true });

      pipeline(queryStream, csvStream, res, (err: any) => {
        if (err) {
          console.error("Pipeline failed:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Export failed" });
          }
        }
      });
    } catch (error) {
      console.error("Export failed:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to export data" });
      }
    }
  }

  async handleMqttDataExcelStream(req: any, res: any) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  try {
    // Set header untuk file Excel
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="mqtt_data_export.xlsx"'
    );

    // Buat workbook streaming
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: true,
    });

    // Query stream
    const query = db("mqtt_datas")
      .select("*")
      .whereBetween("created_at", [startDate, endDate])
      .unionAll((qb: { select: (arg0: string) => { (): any; new(): any; from: { (arg0: string): { (): any; new(): any; whereBetween: { (arg0: string, arg1: any[]): void; new(): any; }; }; new(): any; }; }; }) => {
        qb.select("*")
          .from("mqtt_datas_archive")
          .whereBetween("created_at", [startDate, endDate]);
      })
      .orderBy("created_at", "asc");

    const queryStream = query.stream();

    let sheetIndex = 1;
    let rowCount = 0;
    let worksheet = workbook.addWorksheet(`MQTT Data ${sheetIndex}`);
    let headerSet = false;

    queryStream.on("data", (row: {}) => {
      // Set kolom sekali per sheet
      if (!headerSet) {
        worksheet.columns = Object.keys(row).map((key) => ({
          header: key,
          key: key,
          width: 20,
        }));
        headerSet = true;
      }

      worksheet.addRow(row).commit();
      rowCount++;

      // Jika melebihi batas Excel → buat sheet baru
      if (rowCount >= 1048576) {
        worksheet.commit();
        sheetIndex++;
        worksheet = workbook.addWorksheet(`MQTT Data ${sheetIndex}`);
        headerSet = false;
        rowCount = 0;
      }
    });

    queryStream.on("end", async () => {
      worksheet.commit();
      await workbook.commit(); // tutup workbook
    });

    queryStream.on("error", (err: any) => {
      console.error("Query stream failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Export failed" });
      }
    });
  } catch (error) {
    console.error("Export failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export Excel file" });
    }
  }
}

}

export = DataClientController;
