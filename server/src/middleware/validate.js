import { AppError } from '../utils/AppError.js';

/** Validates req.body against a zod schema and replaces it with the parsed value. */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    const first = Object.values(fields)[0] || 'Invalid request';
    return next(AppError.badRequest(first, { fields }));
  }
  req.body = result.data;
  next();
};
