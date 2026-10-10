import { setServers } from 'node:dns';
import { MongoClient, type Db } from 'mongodb';
import { env } from '../config/env';

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (database) return database;

  // The driver resolves mongodb+srv:// via node:dns; allow overriding unusable OS DNS servers.
  if (env.DNS_SERVERS.length > 0) {
    setServers(env.DNS_SERVERS);
  }

  client = new MongoClient(env.MONGODB_URI, {
    appName: 'lms-backend',
    serverSelectionTimeoutMS: 10_000,
  });
  await client.connect();
  database = client.db(env.MONGODB_DB_NAME);
  await database.command({ ping: 1 });
  return database;
}

export function getDb(): Db {
  if (!database) {
    throw new Error('Database is not connected. Call connectToDatabase() first.');
  }
  return database;
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error('Database is not connected. Call connectToDatabase() first.');
  }
  return client;
}

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await getDb().command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (client) {
    await client.close();
  }
  client = null;
  database = null;
}
