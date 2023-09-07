import jwt from 'jwt-simple';
import { logger, db, validateParams, sendResponseCustom, sendResponseError, errorCodes, createError, validateParamsAll, getConfig } from '../utils/util';
import 'dotenv/config';
import ModelUser from '../models/userModel';

class AuthController {
  /**
   * API Create JWT Token
   * @param {*} req 
   * @author Roby Parlan
   */
  async createToken(req: any, res: any) {
    try {
      const reqBody = req.body

      let apiClient = await db.select(db.raw(`*`))
        .from('api_clients')
        .whereRaw(`client_id = ?`, [reqBody.client_id])
      
      if (apiClient.length == 0) {
        logger.error(`-------- [CREATE-TOKEN] : Client not found! ------`)
        throw createError('Client not found!', 'E_UNAUTHORIZED')
      }
      apiClient = apiClient[0]

      if (apiClient.secret_key !== reqBody.secret_key) {
        logger.error(`-------- [CREATE-TOKEN] : Secret Key invalid! ------`)
        throw createError('Secret Key invalid!', 'E_UNAUTHORIZED')
      }

      let expDate = Date.now() + (apiClient.jwt_age * 1000)
      let id = apiClient.client_id
      let jwtKey: any = process.env.JWT_SECRET_KEY
      let token = jwt.encode({ exp: expDate, id }, jwtKey)

      let result = {
        access_token: token,
        expires_in: apiClient.jwt_age,
        type: 'Bearer'
      }

      logger.info(`-------- [CREATE-TOKEN] : ${JSON.stringify(result)} ------`)
      return sendResponseCustom(res, result)

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * API Handle Login
   * @param {*} req 
   * @author Roby Parlan
   */
  async handleLogin(req: any, res:any) {
    try {
      let isValid = await validateParams(req, ['username', 'password'])
      if (isValid) {
        res.status(isValid.status).json({ success: false, ...isValid})
        return
      }
      const reqBody = req.body

      let user = new ModelUser()

      let result = await user.login(reqBody)

      return sendResponseCustom(res, result)

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

}

export = AuthController