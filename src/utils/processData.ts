import { logger, db, errorCodes, moment }
   from './util';
import axios from 'axios';
import CronJob from 'node-cron'
import 'dotenv/config';
const apiKey = process.env.API_KEY
const apiSecret = process.env.API_SECRET

class ProcessData {
  /**
   * Function scheduler send data iot to API klhk
   * @returns 
   */
  async syncDataIot() {
    try {
      logger.info(`------------------- SYNC DATA STARTED ------------------`)
      let dataUser = await db.select(db.raw(`
        distinct u.id
        from watermonitoring w 
        inner join devices d on d.id_mesin = w.uuid 
        inner join users u on u.id = d.dinas_id 
        where w.is_success = false
      `))

      for (let i = 0; i < dataUser.length; i++) {
        const elx = dataUser[i];
        
        let data = await db.select(db.raw(`u.api_key, u.secret_key, w.*
          from watermonitoring w 
          inner join devices d on d.id_mesin = w.uuid 
          inner join users u on u.id = d.dinas_id 
          where is_success = false and u.id = ?
          limit 10000
          `, elx.id))
  
        if (data.length == 0) {
          logger.info(`------------------- SYNC DATA IS EMPTY ------------------`)
          continue
        }
  
        let dataIot: any = {
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
        }
        let tmpData: any = []
        let count: any = 0
  
        for (let i = 0; i < data.length; i++) {
          const el: any = data[i];
          logger.info(`------------------- SYNC DATA PROCESSING ${i+1}/${data.length} ------------------`)
          try {
            tmpData.push(el.id)
            count += 1
            dataIot.id_stasiun = el.id_stasiun
            dataIot.temperature += parseFloat(el.temperature)
            dataIot.tds += parseFloat(el.tds)
            dataIot.do_ += parseFloat(el.do_)
            dataIot.ph += parseFloat(el.ph)
            dataIot.turbidity += parseFloat(el.turbidity)
            dataIot.waterlevel += parseFloat(el.waterlevel)
            dataIot['no3'] += parseFloat(el['no3'])
            dataIot['nh3n'] += parseFloat(el['nh3n'])
            dataIot.cod += parseFloat(el.cod)
            dataIot.bod += parseFloat(el.bod)
            dataIot.tss += parseFloat(el.tss)
  
          } catch (error: any) {
            if (!errorCodes[error.code])
              logger.error(error)
          }        
        }
  
        let options = {
          url: process.env.URL_KLHK,
          method: 'POST',
          header: {
            'Content-Type': 'Application/json'
          },
          data: {
            "data" : {
              "IDStasiun" : dataIot.id_stasiun,
              "Tanggal" : moment().format(`YYYY-MM-DD`),
              "Jam" : moment().format(`HH:ss:mm`),
              "Suhu" : parseFloat(dataIot.temperature) / count,
              "DHL" : 0,
              "TDS" : parseFloat(dataIot.tds) / count,
              "Salinitas" : 0,
              "DO" : parseFloat(dataIot.do_) / count,
              "PH" : parseFloat(dataIot.ph) / count,
              "Turbidity" : parseFloat(dataIot.turbidity) / count,
              "Kedalaman" : parseFloat(dataIot.waterlevel) / count,
              "SwSG" : 0,
              "Nitrat" : parseFloat(dataIot['no3']) / count,
              "Amonia'" : parseFloat(dataIot['nh3n']) / count,
              "ORP" : 0,
              "COD" : parseFloat(dataIot.cod) / count,
              "BOD" : parseFloat(dataIot.bod) / count,
              "TSS" : parseFloat(dataIot.tss) / count
              },
              "apikey" : data[0].api_key,
              "apisecret" : data[0].secret_key
            }
        }
  
        logger.info(`------------------- SYNC SUBMIT DATA TO API MENLHK ------------------`)
        let result = await axios.request(options)
        logger.info(`------------------- SYNC RESPONSE FROM API MENLHK ${JSON.stringify(result.data)} ------------------`)
        let statusCode = result.data.status.statusCode
  
        if (statusCode == 200) {
          logger.info(`------------------- [SYNC-SUCCESS] UPDATE DATA WATERMONITORING ------------------`)
          for (let r = 0; r < tmpData.length; r++) {
            const el = tmpData[r];
            await db.table('watermonitoring')
            .whereRaw(`id = ?`, el)
            .update({
              is_success: true,
              sync_time: new Date(),
              res_menlhk: JSON.stringify({req: options, res:result.data})
            })
          }
          logger.info(`------------------- [SYNC-SUCCESS] UPDATE SUCCESFULLY ------------------`)
        } else {
          logger.info(`------------------- [SYNC-FAILED] UPDATE DATA WATERMONITORING ------------------`)
          for (let d = 0; d < tmpData.length; d++) {
            const el = tmpData[d];
            await db.table('watermonitoring')
            .whereRaw(`id = ?`, el)
            .update({
              is_success: true,
              sync_time: new Date(),
              res_menlhk: JSON.stringify({req: options, res:result.data})
            })
          }
          logger.info(`------------------- [SYNC-FAILED] UPDATE SUCCESFULLY ------------------`)
        }
      }


    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)
    }
  }

  async initScheduledJobs() {
    const scheduledJobFunction = CronJob.schedule(process.env.SET_TIME_CRONJOB || "0 */1 * * *", async () => {
      let ctx = new ProcessData()
      await ctx.syncDataIot()
    });
  
    scheduledJobFunction.start();
  }
}

export = ProcessData