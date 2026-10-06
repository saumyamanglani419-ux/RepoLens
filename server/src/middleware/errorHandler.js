import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let error = err;

  if (err instanceof mongoose.Error.CastError) {
    error = AppError.notFound('Resource not found');
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = AppError.badRequest(Object.values(err.errors)[0]?.message || 'Invalid data');
  } else if (err?.code === 11000) {
    error = AppError.conflict('A record with that value already exists.');
  } else if (err?.type === 'entity.parse.failed') {
    error = AppError.badRequest('Malformed JSON body.');
  } else if (err?.type === 'entity.too.large') {
    error = new AppError('Request body too large.', 413, 'PAYLOAD_TOO_LARGE');
  } else if (!(err instanceof AppError)) {
    console.error('[error]', err);
    error = new AppError(
      env.isProd ? 'Something went wrong on our side.' : err?.message || 'Unknown error',
      500,
      'INTERNAL_ERROR',
    );
  }

  if (error.status >= 500 && err instanceof AppError) console.error('[error]', err.message);

  res.status(error.status).json({
    error: {
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
