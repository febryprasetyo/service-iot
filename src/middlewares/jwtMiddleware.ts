import { Request, Response, NextFunction } from "express";
import { isValidateToken, decodeToken, logger } from "../utils/util";

function JwtMiddleware(access:string) {
  return async function (req: Request, res: Response, next: NextFunction ) {
    var authorization = req.headers['authorization']

    if (authorization) {
      try {
        var token = null;
        var arr = authorization.split(' ');
        if (arr.length === 2) {
            if (arr[0].toUpperCase() === 'BEARER')
              token = arr[1];
        }
  
        let isValid = await isValidateToken(token)
        if (!isValid) {
            res.status(401).json({
              success: false,
              message: 'Access token expired or invalid'
            });
            return;
        }
  
        let accessList = access.split(':')

        let data = await decodeToken(token)

        if (!accessList.includes(data.userData.role_id)) {
          res.status(401).json({
            success: false,
            message: 'Access API denied!'
          });
          return;
        }
        
        req.body.user_id = data.userData.user_id
        next();
      } catch (err) {
        res.status(401).json({
          success: false,
          message: 'Access token invalid!'
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: 'Access token invalid!'
      });
      return
    }
  }
}

export { JwtMiddleware }