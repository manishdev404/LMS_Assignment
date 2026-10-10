import type { ObjectId } from 'mongodb';
import type { ErrorCode } from '../constants/error-codes';
import type { Role } from '../constants/roles';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string | undefined;
}

/** Who performed an action — stored as a snapshot so history stays readable if a user changes. */
export interface ActorSnapshot {
  userId: ObjectId;
  name: string;
  role: Role;
}

export interface ActorDto {
  id: string;
  name: string;
  role: Role;
}

export interface FieldIssue {
  location: 'body' | 'query' | 'params';
  field: string;
  message: string;
}
