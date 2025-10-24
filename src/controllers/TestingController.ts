import {
  logger, sendResponseCustom, sendResponseError, errorCodes,
  createError, getConfig, validateParamsAll, checkDir
} from '../utils/util';
import contentPreview from '../utils/view-email/insurancePreview';
import 'dotenv/config'
import _ from 'lodash'

class TestingController {

  /**
   * Testing Request Validator
   */
  async testValidator(req: any, res: any) {
    try {
      let reqBody = req.body

      let rules = {
        username: 'required',
        email: 'required|email'
      }

      // Validate the request params
      await validateParamsAll(reqBody, rules)
        .catch((err) => {
          delete err.failed
          throw createError('', 'E_BAD_REQUEST', err)
          // return sendResponseCustom(res, err, 400)
        })

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * Testing upload file
   */
  async testUploadFile(req: any, res: any) {
    try {
      let reqBody = req.body

      logger.info('reqBody : ', reqBody)
      
      let file = req.files
      
      logger.info('file : ', file[0].buffer.toString('base64'))

      return sendResponseCustom(res, reqBody)

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

}

export = TestingController