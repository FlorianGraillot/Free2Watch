import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE' || err?.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
    status = 409;
    message = 'A record with these values already exists';
  } else if (err?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    status = 409;
    message = 'This record is still referenced by other content';
  } else if (err?.code === 'SQLITE_CONSTRAINT_CHECK') {
    status = 400;
    message = 'The submitted data violates a database constraint';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  if (config.isProduction && status >= 500) {
    message = 'Internal server error';
    details = undefined;
  }

  res.status(status).json({
    message,
    ...(details ? { details } : {}),
    ...(config.isProduction ? {} : { stack: status >= 500 ? err.stack : undefined }),
  });
}

export { ApiError };
