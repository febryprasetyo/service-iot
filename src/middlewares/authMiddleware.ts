import { Request, Response, NextFunction } from "express";
import { logger, redisClient } from "../utils/util";
import { prefixKeyRedis } from "../config/prefixKeyRedis";

function AuthMiddleware (access: string) {
  return async function (req: Request, res: Response, next: NextFunction ) {
    var authorization: any = req.headers['authorization']

    if (!authorization) {
      res.status(401).json({
        success: false,
        message_id: 'Otorisasi tidak ditemukan!',
        message_en: 'Authorization required!'
      });
      return
    }

    var token = null;
    var arr = authorization.split(' ');
    if (arr.length === 2) {
        if (arr[0].toUpperCase() === 'BEARER')
          token = arr[1];
    }
  
    if (token) {
      let tmpAccess: any = access.split(':')
      let obj: any = {
        kd_menu: tmpAccess[0],
        access: tmpAccess[1],
        is_access: tmpAccess[2]
      }

      let combineKey = prefixKeyRedis.auth + token
  
      //get value redis
      let valueRedis: any = await redisClient.get(combineKey)
      if (valueRedis) {
        let expired: any = process.env.REDIS_EXPIRES
        await redisClient.expire(combineKey, expired)
        valueRedis = await redisClient.get(combineKey)
      } else {
        res.status(401).json({
          success: false,
          message_id: 'Key Token Api kadaluarsa!',
          message_en: 'Key Token Api expired!',
          message_code: 'TOKEN-EXPIRED'
        });
        return
      }

      valueRedis = JSON.parse(valueRedis)
      let menus = valueRedis.menus.filter((v: any) => v.kd_menu == obj.kd_menu)

      let isValid: boolean = true
      for (let i = 0; i < menus.length; i++) {
        const el = menus[i];
        logger.info(obj)
        if (el[obj.access].toString() !== obj.is_access) {
          isValid = false
          break;
        }
      }

      if (!isValid) {
        res.status(401).json({
          success: false,
          message_id: 'Tidak ada akses!',
          message_en: 'Cannot access!',
          message_code: 'UNAUTHORIZED'
        });
        return
      }
  
      next()
  
    } else {
      res.status(401).json({
        success: false,
        message_id: 'Key Token Api kosong!',
        message_en: 'Key Token Api required!'
      });
      return
    }
  }
}

export { AuthMiddleware }