import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MongoServerError } from 'mongodb';
import multer from 'multer';
import { ZodError } from 'zod';
import { SALARY_SLIP_UPLOAD } from '../constants/upload';
import type { ApiErrorBody } from '../interfaces/common.interface';
import { AppError } from '../utils/app-error';

function isBodyParserError(error: unknown): error is { type: string } {
  return typeof error === 'object' && error !== null && 'type' in error && typeof error.type === 'string';
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return AppError.badRequest('Some fields are invalid', error.issues, 'VALIDATION_ERROR');
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      const maxMb = SALARY_SLIP_UPLOAD.MAX_SIZE_BYTES / (1024 * 1024);
      return new AppError(413, 'FILE_TOO_LARGE', `Salary slip must be ${maxMb} MB or smaller.`);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
      return AppError.badRequest(
        `Upload exactly one file in the "${SALARY_SLIP_UPLOAD.FIELD_NAME}" field.`,
      );
    }
    return AppError.badRequest(error.message);
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    const fields = Object.keys((error['keyValue'] as Record<string, unknown> | undefined) ?? {});
    return AppError.conflict(
      `A record with the same ${fields.join(', ') || 'value'} already exists.`,
      'DUPLICATE_KEY',
    );
  }

  if (isBodyParserError(error)) {
    if (error.type === 'entity.parse.failed') {
      return AppError.badRequest('Request body is not valid JSON.');
    }
    if (error.type === 'entity.too.large') {
      return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
    }
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const appError = normalizeError(error);

  if (appError.statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }

  if (res.headersSent) {
    res.end();
    return;
  }

  const body: ApiErrorBody = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details === undefined ? {} : { details: appError.details }),
    },
  };
  res.status(appError.statusCode).json(body);
};

export const notFoundHandler: RequestHandler = (req) => {
  throw AppError.notFound(`Route ${req.method} ${req.originalUrl} does not exist.`);
};
