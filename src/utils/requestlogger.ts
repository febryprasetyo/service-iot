import multiparty from 'multiparty';
import { logger } from './util';

export function RequestLogger (req: any, res: any, next: any ) {
    const reqId = Date.now()
    req.headers['request-id'] = reqId

    var strLog = '<<<<< REQUEST RECEIVED: { method: ' + req.method + ', url: ' + req.originalUrl + ', request-id: ' + reqId + ' } <<<<<';

    strLog += ' -- REQUEST HEADERS: ' + JSON.stringify(req.headers);

    if (req.params && Object.keys(req.params).length > 0)
        strLog += ' -- REQUEST PARAMS: ' + JSON.stringify(req.params);
    if (req.query && Object.keys(req.query).length > 0)
        strLog += ' -- REQUEST QUERY: ' + JSON.stringify(req.query);
    if (req.body && Object.keys(req.body).length > 0)
        strLog += ' -- REQUEST BODY: ' + JSON.stringify(req.body);
    if (req.files && req.files.length > 0)
        strLog += ' -- REQUEST FILES: ' + JSON.stringify(req.files);

    logger.info(strLog.length > 2000 ? (strLog.slice(0, 2000)+'--------[TRUNCATED BY LOGGER, ACTUAL BODY LENGTH: ' + strLog.length + ' chars]-------- }') : strLog);
    next()
}