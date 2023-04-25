import { logger, db, errorCodes, moment }
   from './util';
import axios from 'axios';
import CronJob from 'node-cron'

class ProcessData {
  async syncDataIot() {
    try {
      logger.info(`------------------- SYNC DATA STARTED ------------------`)
      let data = await db.select(db.raw(`*`))
        .from('watermonitoring')
        .whereRaw(`is_success = false AND exec_count <= 2`)

      if (data.length == 0) {
        logger.info(`------------------- SYNC DATA IS EMPTY ------------------`)
        return
      }

      let maxLength = data.length <= 500 ? data.length : 500

      for (let i = 0; i < maxLength; i++) {
        const el = data[i];
        logger.info(`------------------- SYNC DATA PROCESSING ${i+1}/${maxLength} ------------------`)
        try {
          let options = {
            url: 'https://ppkl.menlhk.go.id/onlimo/uji/connect/uji_data_onlimo',
            method: 'POST',
            header: {
              'Content-Type': 'Application/json'
            },
            data: {
              "data" : {
                "IDStasiun" : "STASIUN-UJI",
                "Tanggal" : moment().format(`YYYY-MM-DD`),
                "Jam" : moment().format(`HH:ss:mm`),
                "Suhu" : el.temperature,
                "DHL" : 12,
                "TDS" : el.tds,
                "Salinitas" : 14.12,
                "DO" : el.do,
                "PH" : el.ph,
                "Turbidity" : el.turbidity,
                "Kedalaman" : 18,
                "SwSG" : 19,
                "Nitrat" : 20,
                "Amonia'" : 22,
                "ORP" : 23,
                "COD" : el.cod,
                "BOD" : el.bod,
                "TSS" : el.tss
                },
                "apikey" : "[apikey]",
                "apisecret" : "[apisecret]"
              }
          }
    
          logger.info(`------------------- SYNC SUBMIT DATA TO API MENLHK ------------------`)
          let result = await axios.request(options)
          logger.info(`------------------- SYNC RESPONSE FROM API MENLHK ${JSON.stringify(result.data)} ------------------`)
          let statusCode = result.data.status.statusCode

          if (statusCode == 200) {
            logger.info(`------------------- [SYNC-SUCCESS] UPDATE DATA WATERMONITORING ------------------`)
            await db.table('watermonitoring')
            .whereRaw(`id = ?`, el.id)
            .update({
              is_success: true,
              sync_time: new Date(),
              res_menlhk: JSON.stringify(result.data),
              exec_count: parseInt(el.exec_count) + 1
            })
            logger.info(`------------------- [SYNC-SUCCESS] UPDATE SUCCESFULLY ------------------`)
          } else {
            logger.info(`------------------- [SYNC-FAILED] UPDATE DATA WATERMONITORING ------------------`)
            await db.table('watermonitoring')
            .whereRaw(`id = ?`, el.id)
            .update({
              sync_time: new Date(),
              res_menlhk: JSON.stringify(result.data),
              exec_count: parseInt(el.exec_count) + 1
            })
            logger.info(`------------------- [SYNC-FAILED] UPDATE SUCCESFULLY ------------------`)
          }

        } catch (error: any) {
          if (!errorCodes[error.code])
            logger.error(error)
        }        
      }

    } catch (error: any) {
      if (!errorCodes[error.code])
        logger.error(error)
    }
  }

  async initScheduledJobs() {
    const scheduledJobFunction = CronJob.schedule("*/1 * * * *", async () => {
      let ctx = new ProcessData()
      await ctx.syncDataIot()
    });
  
    scheduledJobFunction.start();
  }
}

export = ProcessData