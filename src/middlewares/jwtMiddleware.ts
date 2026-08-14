import { Request, Response, NextFunction } from "express";
import { isValidateToken, decodeToken, logger } from "../utils/util";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}


export type JwtMiddlewareMessages = {
  expiredOrInvalid: string;
  accessDenied: string;
  invalid: string;
};

const defaultJwtMessages: JwtMiddlewareMessages = {
  expiredOrInvalid: 'Access token expired or invalid',
  accessDenied: 'Access API denied!',
  invalid: 'Access token invalid!'
};

function JwtMiddleware(access:string, messages: JwtMiddlewareMessages = defaultJwtMessages) {
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
              message: messages.expiredOrInvalid
            });
            return;
        }
  
        let accessList = access.split(':')

        let data = await decodeToken(token)

        if (!accessList.includes(data.userData.role_id)) {
          res.status(401).json({
            success: false,
            message: messages.accessDenied
          });
          return;
        }
        
        if (!req.body) req.body = {};
        req.body.user_id = data.userData.user_id
        req.body.role_id = data.userData.role_id
        req.user = data.userData;

        next();
      } catch (err) {
        res.status(401).json({
          success: false,
          message: messages.invalid
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: messages.invalid
      });
      return
    }
  }
}

function JwtMiddlewareOptional(access:string) {
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
        if (isValid) {
          let data = await decodeToken(token)
          // Optional: check access list merely to decide if we attach user info or not, 
          // or strictly enforced IF token is valid?
          // User request: "If login, filter data. If not, open all data."
          // So if token is valid, we act as authenticated user.
          
          let accessList = access.split(':')
          if (accessList.includes(data.userData.role_id)) {
              if (!req.body) req.body = {};
              req.body.user_id = data.userData.user_id
              req.body.role_id = data.userData.role_id
              req.user = data.userData;
          }
        }
      } catch (err) {
        // Ignore error for optional auth, treat as public
      }
    }
    // Proceed regardless of token presence/validity
    next();
  }
}

export { JwtMiddleware, JwtMiddlewareOptional }
