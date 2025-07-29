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

        let ctxData = []
        let tmpData: any = []
  
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
                  "apikey" : data[0].api_key,
                "apisecret" : data[0].secret_key
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
          ctxData.push(...ctx)
        } //end looping dataUser
        
        let finalData: any = Object.values(
          ctxData.reduce((acc: any, item: any) => {
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
                "apikey" : item.apikey,
                "apisecret" : item.apisecret
              }
            }
            acc[item.id_stasiun].count += item.count
            acc[item.id_stasiun].temperature += parseFloat(item.temperature)
            acc[item.id_stasiun].tds += parseFloat(item.tds)
            acc[item.id_stasiun].do_ += parseFloat(item.do_)
            acc[item.id_stasiun].ph += parseFloat(item.ph)
            acc[item.id_stasiun].turbidity += parseFloat(item.turbidity)
            acc[item.id_stasiun].waterlevel += parseFloat(item.waterlevel)
            acc[item.id_stasiun]['no3'] += parseFloat(item['no3'])
            acc[item.id_stasiun]['nh3n'] += parseFloat(item['nh3n'])
            acc[item.id_stasiun].cod += parseFloat(item.cod)
            acc[item.id_stasiun].bod += parseFloat(item.bod)
            acc[item.id_stasiun].tss += parseFloat(item.tss)
            return acc;
          }, {})
        );
        console.log(`------------------------------- finalData : `, finalData)

        for (let z = 0; z < finalData.length; z++) {
          const elz: any = finalData[z];
          logger.info(`------------------- SYNC DATA PROCESSING ${z+1}/${finalData.length} ------------------`)
          
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
                "Jam" : moment().format(`HH:mm:ss`),
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
                "apikey" : elz.apikey,
                "apisecret" : elz.apisecret
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
  
        return sendResponseCustom(res, {
          success: true
        })
      } catch (error: any) {
        if (!errorCodes[error.code])
          logger.error(error)
  
        return sendResponseError(res, error)
      }
    }

    /**
     * Handle Submit Data to menlhk
     */
//     async handleSendData(req: any, res: any) {
//   try {
//     logger.info(`------------------- SYNC DATA STARTED ------------------`);

//     const rawData = await db
//       .select([
//         'w.*',
//         'u.api_key',
//         'u.secret_key',
//       ])
//       .from('mqtt_datas as w')
//       .innerJoin('devices as d', 'd.id_mesin', 'w.uuid')
//       .innerJoin('users as u', 'u.id', 'd.dinas_id')
//       .where('w.is_success', false)
//       .whereNotNull('w.id_stasiun');

//     // Group by id_stasiun dan ambil 100 data pertama tiap grup
//     const groupedData: Record<string, any[]> = {};

//     for (const row of rawData) {
//       const key = row.id_stasiun;
//       if (!groupedData[key]) groupedData[key] = [];
//       if (groupedData[key].length < 100) groupedData[key].push(row);
//     }

//     for (const [id_stasiun, rows] of Object.entries(groupedData)) {
//       logger.info(`---- Syncing ID Stasiun: ${id_stasiun} with ${rows.length} data`);

//       const count = rows.length;
//       const acc = {
//         temperature: 0, tds: 0, do_: 0, ph: 0, turbidity: 0, waterlevel: 0,
//         no3: 0, nh3n: 0, cod: 0, bod: 0, tss: 0
//       };

//       for (const row of rows) {
//         acc.temperature += parseFloat(row.temperature);
//         acc.tds += parseFloat(row.ct);
//         acc.do_ += parseFloat(row.do_);
//         acc.ph += parseFloat(row.ph);
//         acc.turbidity += parseFloat(row.tur);
//         acc.waterlevel += parseFloat(row.depth);
//         acc.no3 += parseFloat(row.no3_3);
//         acc.nh3n += parseFloat(row.n);
//         acc.cod += parseFloat(row.cod);
//         acc.bod += parseFloat(row.bod);
//         acc.tss += parseFloat(row.tss);
//       }

//       const sampleRow = rows[0];
//       const payload = {
//         data: {
//           IDStasiun: id_stasiun,
//           Tanggal: moment().format(`YYYY-MM-DD`),
//           Jam: moment().format(`HH:mm:ss`),
//           Suhu: (acc.temperature / count).toFixed(2),
//           TDS: (acc.tds / count).toFixed(2),
//           DO: (acc.do_ / count).toFixed(2),
//           PH: (acc.ph / count).toFixed(2),
//           Turbidity: (acc.turbidity / count).toFixed(2),
//           Kedalaman: (acc.waterlevel / count).toFixed(2),
//           Nitrat: (acc.no3 / count).toFixed(2),
//           Amonia: (acc.nh3n / count).toFixed(2),
//           COD: (acc.cod / count).toFixed(2),
//           BOD: (acc.bod / count).toFixed(2),
//           TSS: (acc.tss / count).toFixed(2),
//         },
//         apikey: sampleRow.api_key,
//         apisecret: sampleRow.secret_key
//       };

//       const options = {
//         url: process.env.URL_KLHK,
//         method: 'POST',
//         header: { 'Content-Type': 'Application/json' },
//         data: payload
//       };

//       logger.info(`Sending data to KLHK for stasiun ${id_stasiun}`);
//       const result = await axios.request(options);
//       logger.info(`Response: ${JSON.stringify(result.data)}`);

//       const statusCode = result.data?.status?.statusCode || 500;

//       await db('mqtt_datas')
//         .whereIn('id', rows.map(r => r.id))
//         .update({
//           is_success: true,
//           sync_time: new Date()
//         });

//       await db('res_klhk')
//         .insert({
//           payload: JSON.stringify(payload),
//           data_uid: result.data.rows?.data_uid || '-',
//           status_code: result.data.status?.statusCode || null,
//           status_desc: result.data.status?.statusDesc || JSON.stringify(result.data),
//           id_stasiun: id_stasiun
//         });

//       logger.info(`[SYNC-${statusCode == 200 ? 'SUCCESS' : 'FAILED'}] - ${id_stasiun}`);
//     }

//     return sendResponseCustom(res, { success: true });
//   } catch (error: any) {
//     if (!errorCodes[error.code]) logger.error(error);
//     return sendResponseError(res, error);
//   }
// }

}

export = IntegrationController
