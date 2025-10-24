import multiparty from 'multiparty';
import { logger } from './util';

export function RequestLogger (req: any, res: any, next: any ) {
  // call next to advance the request
  var form = new multiparty.Form();
  form.parse(req, function (err, fields, files) {
    const reqId = Date.now()
    req.headers['request-id'] = reqId

    var strLog = '<<<<< REQUEST RECEIVED: { method: ' + req.method + ', url: ' + req.originalUrl + ', request-id: ' + req.headers['request-id'] + ' } <<<<<';

    strLog += ' -- REQUEST HEADERS: ' + JSON.stringify(req.headers);

    if (req.params)
        strLog += ' -- REQUEST PARAMS: ' + JSON.stringify(req.params);
    if (req.body)
        strLog += ' -- REQUEST BODY: ' + JSON.stringify(req.body);
    if (fields)
        strLog += ' -- FORM/MULTIPART FIELDS: ' + JSON.stringify(fields);
    if (files)
        strLog += ' -- FORM/MULTIPART FILES: ' + JSON.stringify(files);

    logger.info(strLog.length > 2000 ? (strLog.slice(0, 2000)+'--------[TRUNCATED BY LOGGER, ACTUAL BODY LENGTH: ' + strLog.length + ' chars]-------- }') : strLog);
  });
  next()
}