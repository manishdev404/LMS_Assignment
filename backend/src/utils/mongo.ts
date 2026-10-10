import { MongoServerError, ObjectId } from 'mongodb';
import type { AuthUser } from '../interfaces/auth.interface';
import type { ActorSnapshot } from '../interfaces/common.interface';

/** Callers must pass a value already validated as a 24-char hex id. */
export function toObjectId(id: string): ObjectId {
  return ObjectId.createFromHexString(id);
}

export function isDuplicateKeyError(error: unknown, field?: string): error is MongoServerError {
  if (!(error instanceof MongoServerError) || error.code !== 11000) return false;
  if (!field) return true;
  const keyPattern: unknown = error['keyPattern'];
  return typeof keyPattern === 'object' && keyPattern !== null && field in keyPattern;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toActorSnapshot(user: AuthUser): ActorSnapshot {
  return { userId: user.id, name: user.name, role: user.role };
}
