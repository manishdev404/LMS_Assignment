import type { ClientSession } from 'mongodb';
import { getMongoClient } from './client';

/**
 * Runs `work` inside a multi-document transaction (Atlas clusters are replica sets).
 * The driver retries `work` on transient errors, so it must only perform DB operations
 * through the provided session and must not swallow errors.
 */
export async function runInTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = getMongoClient().startSession();
  try {
    return await session.withTransaction(work, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
  } finally {
    await session.endSession();
  }
}
