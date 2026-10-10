import { createApp } from './app';
import { env } from './config/env';
import { connectToDatabase, disconnectFromDatabase } from './db/client';
import { ensureIndexes } from './db/indexes';
import { verifyEmailTransport } from './services/email.service';

async function bootstrap(): Promise<void> {
  await connectToDatabase();
  await ensureIndexes();
  console.log(`Connected to MongoDB (database "${env.MONGODB_DB_NAME}")`);

  const server = createApp().listen(env.PORT, () => {
    console.log(`LMS API listening on http://localhost:${env.PORT}/api`);
    void verifyEmailTransport();
  });

  server.on('error', (error) => {
    console.error('HTTP server error:', error);
    process.exit(1);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => {
      void disconnectFromDatabase().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start the API:', error);
  process.exit(1);
});
