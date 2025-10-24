import { logger, validateParams, sendResponseCustom, sendResponseError, errorCodes, createError, validateParamsAll, getConfig } from '../utils/util';
import 'dotenv/config';
import ModelUser from '../models/userModel';

class AuthController {

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