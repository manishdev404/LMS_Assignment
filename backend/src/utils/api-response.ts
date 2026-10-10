import type { Response } from 'express';
import type { ApiSuccess, Pagination } from '../interfaces/common.interface';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}

export function buildPagination(page: number, limit: number, total: number): Pagination {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
