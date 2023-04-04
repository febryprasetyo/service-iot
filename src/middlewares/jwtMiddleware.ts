import { isValidateToken } from "../utils/util";

export default async function JwtMiddleware(req: any, res: any, next: any ) {
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
      } else {
          next();
      }
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