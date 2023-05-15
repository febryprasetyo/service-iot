import { logger, db, validateParams, sendResponseCustom, 
  sendResponseError, errorCodes, createError, validateParamsAll, getConfig }
   from '../utils/util';
import 'dotenv/config';
import axios from 'axios';

class IntegrationController {
  /**
   * Handle Submit Data to menlhk
   * @author Roby Parlan
   */
  async handleSubmitData(req: any, res: any) {
    try {
      let reqBody = req.body

      logger.info(`--------------reqbody :`, reqBody)

      let options = {
        url: 'https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo',
        method: 'POST',
        header: {
          'Content-Type': 'Application/json'
        },
        data: reqBody
      }

      logger.info(`--------------options :`, options)

      let result = await axios.request(options)

      logger.info(`--------------result :`, result)

      return sendResponseCustom(res, result.data)

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }

  /**
   * Handle Get Data IOT
   * @author Roby Parlan
   */
  async handleGetData(req: any, res: any) {
    try {
      let limit = req.query.limit ? req.query.limit : 100

      let data = await db.select(db.raw(`res_menlhk`))
      .from('watermonitoring')
      .orderByRaw('id DESC')
      .limit(limit)

      return sendResponseCustom(res, {
        data
      })
    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)

      return sendResponseError(res, error)
    }
  }
}

export = IntegrationController