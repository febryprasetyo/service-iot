import { logger } from './util';

export function ResponseLogger (req: any, res: any, next: any ) {
  // call next to advance the response
  setTimeout(() => {
    var oldWrite = res.write
    var oldEnd = res.end;
  
    var chunks: any = [];
  
    res.write = function (chunk: any) {
      chunks.push(chunk);
      oldWrite.apply(res, arguments);
    };
  
    res.end = function (chunk: any) {
        if (chunk) chunks.push(chunk);
  
        var body = Buffer.concat(chunks).toString('utf8');
        if (body.length > 2000) body = body.slice(0, 2000) + '--------[TRUNCATED BY LOGGER, ACTUAL BODY LENGTH: ' + body.length + ' chars]-------- }';
  
        logger.info('>>>>> RESPONSE SENT { method: ' + req.method + ', url: ' + req.originalUrl + ', request-id: ' + req.headers['request-id'] + ' }  >>>>>' + ' -- RESPONSE BODY: ' + body);
        oldEnd.apply(res, arguments);
    };
    next(); //move to next middleware
  }, 10);
}