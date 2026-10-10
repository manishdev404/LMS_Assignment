import { isIP } from 'node:net';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z
    .string({ error: 'MONGODB_URI is required (your MongoDB Atlas connection string)' })
    .trim()
    .refine(
      (uri) => uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://'),
      'MONGODB_URI must start with mongodb+srv:// or mongodb://',
    ),
  MONGODB_DB_NAME: z.string().trim().min(1).default('lms'),
  /**
   * Optional DNS servers for resolving the mongodb+srv:// SRV record, e.g. "8.8.8.8,1.1.1.1".
   * Needed on machines where Node cannot use the OS DNS server (common on Windows with an
   * IPv6 link-local router DNS → `querySrv ECONNREFUSED`).
   */
  DNS_SERVERS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean),
    )
    .refine((servers) => servers.every((server) => isIP(server) !== 0), 'DNS_SERVERS must be IP addresses'),
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().int().positive().max(720).default(24),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  COOKIE_SECURE: booleanString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration. Check backend/.env (see .env.example):');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.') || 'env'}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
