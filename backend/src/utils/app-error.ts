import type { ErrorCode } from '../constants/error-codes';

/** An expected, client-facing error. Anything else becomes a generic 500. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown, code: ErrorCode = 'BAD_REQUEST'): AppError {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message: string, code: ErrorCode = 'UNAUTHENTICATED'): AppError {
    return new AppError(401, code, message);
  }

  static forbidden(message: string, code: ErrorCode = 'FORBIDDEN'): AppError {
    return new AppError(403, code, message);
  }

  static notFound(message: string): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, code: ErrorCode = 'CONFLICT', details?: unknown): AppError {
    return new AppError(409, code, message, details);
  }

  static unprocessable(message: string, code: ErrorCode, details?: unknown): AppError {
    return new AppError(422, code, message, details);
  }
}
