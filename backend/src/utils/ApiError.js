class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors) { return new ApiError(400, message, errors); }
  static unauthorized(message) { return new ApiError(401, message || 'Unauthorized'); }
  static forbidden(message) { return new ApiError(403, message || 'Forbidden'); }
  static notFound(message) { return new ApiError(404, message || 'Not found'); }
  static tooMany(message) { return new ApiError(429, message || 'Too many requests'); }
  static internal(message) { return new ApiError(500, message || 'Internal server error', [], false); }
}

export default ApiError;
