import type { Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import type { FieldIssue } from '../interfaces/common.interface';
import type { ValidatedRequest } from '../interfaces/http.interface';
import { AppError } from '../utils/app-error';

interface RequestSchemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

const LOCATIONS = ['params', 'query', 'body'] as const;

/**
 * Validates and normalises request input with Zod. On success the parsed (trimmed, coerced,
 * defaulted) values replace the raw ones, so controllers only ever see clean data.
 * On failure every problem is returned at once as field-level `details`.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const issues: FieldIssue[] = [];
    const parsed: Partial<Record<(typeof LOCATIONS)[number], unknown>> = {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location] ?? {});
      if (result.success) {
        parsed[location] = result.data;
      } else {
        issues.push(
          ...result.error.issues.map((issue) => ({
            location,
            field: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        );
      }
    }

    if (issues.length > 0) {
      throw AppError.badRequest(
        issues[0]?.message ?? 'Some fields are invalid',
        issues,
        'VALIDATION_ERROR',
      );
    }

    if ('body' in parsed) req.body = parsed.body;
    if ('params' in parsed) req.params = parsed.params as typeof req.params;
    if ('query' in parsed) {
      // Express 5 exposes `req.query` as a getter; shadow it with the parsed value.
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
}

/**
 * Declares the shape a controller receives after `validate(...)` ran earlier in the route chain.
 * This is the single place where Express's loosely-typed request is narrowed.
 */
export function validatedHandler<S extends { body?: unknown; query?: unknown; params?: unknown }>(
  controller: (req: ValidatedRequest<S>, res: Response) => Promise<void>,
): RequestHandler {
  return (req: Request, res: Response) => controller(req as unknown as ValidatedRequest<S>, res);
}
