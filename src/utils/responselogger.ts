import { logger } from './util';

export function ResponseLogger (req: any, res: any, next: any ) {
  // call next to advance the response
  var oldWrite = res.write
  var oldEnd = res.end;

  var chunks: any = [];

  res.write = function (chunk: any) {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return oldWrite.apply(res, arguments);
  };

  res.end = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));

      var body = '';
      try {
          if (chunks.length > 0) {
            body = Buffer.concat(chunks).toString('utf8');
          }
      } catch (e) {
          body = '[Response Body logging failed: ' + e + ']';
      }

      if (body.length > 2000) body = body.slice(0, 2000) + '--------[TRUNCATED BY LOGGER, ACTUAL BODY LENGTH: ' + body.length + ' chars]-------- }';

      logger.info('>>>>> RESPONSE SENT { method: ' + req.method + ', url: ' + req.originalUrl + ', request-id: ' + req.headers['request-id'] + ' }  >>>>>' + ' -- RESPONSE BODY: ' + body);
      oldEnd.apply(res, arguments);
  };
  next();
}