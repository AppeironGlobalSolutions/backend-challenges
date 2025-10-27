import { NextFunction, Request, Response } from 'express';
import logger from '../logger/logger';

/**
 * Request logger middleware.
 * Logs method, url, query, params, idempotency key (if present), body size
 * and duration (on response finish). Keep the logs concise and avoid
 * dumping large bodies.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const { method, originalUrl: url, headers, query, params } = req;
  const idempotencyKey =
    headers['idempotency-key'] || headers['Idempotency-Key'];

  // Attempt to determine a small body representation (avoid logging huge payloads)
  let bodyPreview: string | undefined;
  try {
    const body = (req as any).body;
    if (body && typeof body === 'object') {
      const str = JSON.stringify(body);
      bodyPreview =
        str.length > 1024 ? str.slice(0, 1024) + '...(+truncated)' : str;
    } else if (typeof body === 'string') {
      bodyPreview =
        body.length > 1024 ? body.slice(0, 1024) + '...(+truncated)' : body;
    }
  } catch (err) {
    // ignore body serialization errors
  }

  logger.info(
    { method, url, query, params, idempotencyKey },
    'incoming request'
  );

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logPayload: any = { method, url, statusCode, duration };
    if (idempotencyKey) logPayload.idempotencyKey = idempotencyKey;
    if (bodyPreview) logPayload.body = bodyPreview;
    logger.info(logPayload, 'request completed');
  });

  next();
};

export default requestLogger;
