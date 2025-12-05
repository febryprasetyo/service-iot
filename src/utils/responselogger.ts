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

        // Filter chunks to ensure they are Buffers or Uint8Arrays before concatenation
        const validChunks = chunks.filter((c: any) => Buffer.isBuffer(c) || c instanceof Uint8Array);
        
        // If we have mixed content (strings and buffers), we might need a different strategy,
        // but for now, let's try to convert strings to buffers if possible or just log what we can.
        const bufferChunks = chunks.map((c: any) => {
            if (typeof c === 'string') return Buffer.from(c);
            return c;
        });

        var body = '';
        try {
            body = Buffer.concat(bufferChunks).toString('utf8');
        } catch (e) {
            body = '[Response Body logging failed: ' + e + ']';
        }

        if (body.length > 2000) body = body.slice(0, 2000) + '--------[TRUNCATED BY LOGGER, ACTUAL BODY LENGTH: ' + body.length + ' chars]-------- }';
  
        logger.info('>>>>> RESPONSE SENT { method: ' + req.method + ', url: ' + req.originalUrl + ', request-id: ' + req.headers['request-id'] + ' }  >>>>>' + ' -- RESPONSE BODY: ' + body);
        oldEnd.apply(res, arguments);
    };
    next(); //move to next middleware
  }, 10);
}