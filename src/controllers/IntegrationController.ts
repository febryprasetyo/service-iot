import { logger, db, validateParams, sendResponseCustom, moment,
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
        url: process.env.URL_KLHK,
        method: 'POST',
        header: {
          'Content-Type': 'Application/json'
        },
        data: reqBody
      }

      logger.info(`--------------options :`, options)

      let result = await axios.request(options)

      logger.info(`--------------result :`, result.data)

      // await db('res_klhk')
      // .insert({
      //   payload: JSON.stringify(options.data),
      //   data_uid: result.data.rows.data_uid,
      //   status_code: result.data.status.statusCode,
      //   status_desc: result.data.status.statusDesc,
      //   id_stasiun: reqBody.data['IDStasiun']
      // })

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

    /**
   * Handle Get Data IOT
   * @author Roby Parlan
   */
    async handleSendData(req: any, res: any) {
      try {
        logger.info(`------------------- SYNC DATA STARTED ------------------`)
        let dataUser = await db.select(db.raw(`
          distinct u.id
          from mqtt_datas w 
          inner join devices d on d.id_mesin = w.uuid 
          inner join users u on u.id = d.dinas_id 
          where w.is_success = false
        `))
  
        for (let i = 0; i < dataUser.length; i++) {
          const elx = dataUser[i];
          
          let data = await db.select(db.raw(`u.api_key, u.secret_key, w.*
            from mqtt_datas w 
            inner join devices d on d.id_mesin = w.uuid 
            inner join users u on u.id = d.dinas_id 
            where is_success = false and u.id = ? and w.id_stasiun NOTNULL
            `, elx.id))
    
          if (data.length == 0) {
            logger.info(`------------------- SYNC DATA IS EMPTY ------------------`)
            continue
          }

          let tmpData: any = []
          for (let t = 0; t < data.length; t++) {
            const eld = data[t];
            tmpData.push(eld.id)
          }
          let ctx: any = Object.values(
            data.reduce((acc: any, item: any) => {
              if (!acc[item.id_stasiun]) {
                acc[item.id_stasiun] = {
                  id_stasiun: item.id_stasiun,
                  temperature: 0,
                  tds: 0,
                  do_: 0,
                  ph: 0,
                  turbidity: 0,
                  waterlevel: 0,
                  'no3': 0,
                  'nh3n': 0,
                  cod: 0,
                  bod: 0,
                  tss: 0,
                  count: 0,
                }
              }
              acc[item.id_stasiun].count += 1
              acc[item.id_stasiun].temperature += parseFloat(item.temperature)
              acc[item.id_stasiun].tds += parseFloat(item.ct)
              acc[item.id_stasiun].do_ += parseFloat(item.do_)
              acc[item.id_stasiun].ph += parseFloat(item.ph)
              acc[item.id_stasiun].turbidity += parseFloat(item.tur)
              acc[item.id_stasiun].waterlevel += parseFloat(item.depth)
              acc[item.id_stasiun]['no3'] += parseFloat(item['no3_3'])
              acc[item.id_stasiun]['nh3n'] += parseFloat(item['n'])
              acc[item.id_stasiun].cod += parseFloat(item.cod)
              acc[item.id_stasiun].bod += parseFloat(item.bod)
              acc[item.id_stasiun].tss += parseFloat(item.tss)
              return acc;
            }, {})
          );

          console.log(`------------------------------- ctx : `, ctx)
    
          for (let z = 0; z < ctx.length; z++) {
            const elz: any = ctx[z];
            
            let options = {
              url: process.env.URL_KLHK,
              method: 'POST',
              header: {
                'Content-Type': 'Application/json'
              },
              data: {
                "data" : {
                  "IDStasiun" : elz.id_stasiun,
                  "Tanggal" : moment().format(`YYYY-MM-DD`),
                  "Jam" : moment().format(`HH:ss:mm`),
                  "Suhu" : (parseFloat(elz.temperature) / elz.count).toFixed(2),
                  // "DHL" : 0,
                  "TDS" : (parseFloat(elz.tds) / elz.count).toFixed(2),
                  // "Salinitas" : 0,
                  "DO" : (parseFloat(elz.do_) / elz.count).toFixed(2),
                  "PH" : (parseFloat(elz.ph) / elz.count).toFixed(2),
                  "Turbidity" : (parseFloat(elz.turbidity) / elz.count).toFixed(2),
                  "Kedalaman" : (parseFloat(elz.waterlevel) / elz.count).toFixed(2),
                  // "SwSG" : 0,
                  "Nitrat" : (parseFloat(elz['no3']) / elz.count).toFixed(2),
                  "Amonia" : (parseFloat(elz['nh3n']) / elz.count).toFixed(2),
                  // "ORP" : 0,
                  "COD" : (parseFloat(elz.cod) / elz.count).toFixed(2),
                  "BOD" : (parseFloat(elz.bod) / elz.count).toFixed(2),
                  "TSS" : (parseFloat(elz.tss) / elz.count).toFixed(2)
                  },
                  "apikey" : data[0].api_key,
                  "apisecret" : data[0].secret_key
                }
            }
      
            logger.info(`------------------- SYNC SUBMIT DATA TO API MENLHK ------------------`)
            let result = await axios.request(options)
            logger.info(`------------------- SYNC RESPONSE FROM API MENLHK ${JSON.stringify(result.data)} ------------------`)
            let statusCode = result.data.status ? result.data.status.statusCode : 401
      
            if (statusCode == 200) {
              logger.info(`------------------- [SYNC-SUCCESS] UPDATE DATA WATERMONITORING ------------------`)
    
              for (let r = 0; r < tmpData.length; r++) {
                const el = tmpData[r];
                await db.table('mqtt_datas')
                .whereRaw(`id = ?`, el)
                .update({
                  is_success: true,
                  sync_time: new Date(),
                  // res_menlhk: JSON.stringify({req: options, res:result.data})
                })
              }
              await db('res_klhk')
                .insert({
                  payload: JSON.stringify(options.data),
                  data_uid: result.data.rows.data_uid,
                  status_code: result.data.status.statusCode,
                  status_desc: result.data.status.statusDesc,
                  id_stasiun: options.data.data['IDStasiun']
                })
    
              logger.info(`------------------- [SYNC-SUCCESS] UPDATE SUCCESFULLY ------------------`)
            } else {
              logger.info(`------------------- [SYNC-FAILED] UPDATE DATA WATERMONITORING ------------------`)
              for (let r = 0; r < tmpData.length; r++) {
                const el = tmpData[r];
                await db.table('mqtt_datas')
                .whereRaw(`id = ?`, el)
                .update({
                  is_success: true,
                  sync_time: new Date(),
                  // res_menlhk: JSON.stringify({req: options, res:result.data})
                })
              }
              await db('res_klhk')
              .insert({
                payload: JSON.stringify(options.data),
                data_uid: '-',
                status_code: null,
                status_desc: result.data,
                id_stasiun: options.data.data['IDStasiun']
              })
              logger.info(`------------------- [SYNC-FAILED] UPDATE SUCCESFULLY ------------------`)
            }
          }
        }
  
        return sendResponseCustom(res, {
          success: true
        })
      } catch (error: any) {
        if (!errorCodes[error.code])
          logger.error(error)
  
        return sendResponseError(res, error)
      }
    }
}

export = IntegrationController