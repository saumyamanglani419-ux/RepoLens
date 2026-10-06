export class AppError extends Error {
  /**
   * @param {string} message  Human-readable message (safe to show to users)
   * @param {number} status   HTTP status code
   * @param {string} [code]   Machine-readable error code
   * @param {object} [details] Extra info (e.g. validation issues)
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(msg, details) {
    return new AppError(msg, 400, 'BAD_REQUEST', details);
  }
  static unauthorized(msg = 'Authentication required') {
    return new AppError(msg, 401, 'UNAUTHORIZED');
  }
  static notFound(msg = 'Resource not found') {
    return new AppError(msg, 404, 'NOT_FOUND');
  }
  static conflict(msg) {
    return new AppError(msg, 409, 'CONFLICT');
  }
}
