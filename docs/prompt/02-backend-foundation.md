# 02 — Backend Foundation (Express 5 + TypeScript)

## Prompt

Scaffold `backend/` as a single Express 5 + TypeScript API that serves **both** the Borrower Portal
and the Operations Dashboard. Set up config, app factory, global middleware, error handling and the
folder layering described in `00-master-prompt.md`.

## Folder structure

```
backend/
├── src/
│   ├── app.ts                  # createApp(): middleware + routes + error handlers
│   ├── server.ts               # connect DB → ensure indexes → listen → graceful shutdown
│   ├── config/env.ts           # zod-validated process.env
│   ├── constants/              # roles, auth, loan, bre, lead, upload, error-codes
│   ├── db/                     # client.ts, collections.ts, indexes.ts, gridfs.ts, transaction.ts
│   ├── interfaces/             # *.interface.ts + express.d.ts (req.user augmentation)
│   ├── validations/            # common, auth, borrower, sales, sanction, collection, admin (zod)
│   ├── middlewares/            # auth (authenticate/authorize), validate (+ validatedHandler),
│   │                           # upload, error (errorHandler/notFound), rate-limit
│   ├── services/               # *.service.ts
│   ├── controllers/            # *.controller.ts
│   ├── routes/                 # index.ts + *.routes.ts
│   ├── utils/                  # app-error, api-response, jwt, session-cookie, password, money,
│   │                           # loan-math, date, mappers, mongo, file-response
│   └── scripts/seed.ts
├── tests/                      # unit tests for BRE + loan math (vitest)
├── .env.example
├── package.json  (dev, build, start, typecheck, seed, test)
└── tsconfig.json (strict)
```

## Requirements

1. **Config** — `config/env.ts` parses `process.env` with Zod:
   `NODE_ENV, PORT, MONGODB_URI, MONGODB_DB_NAME, JWT_SECRET (≥32 chars), JWT_EXPIRES_IN_HOURS,
   CORS_ORIGINS (comma list), COOKIE_SECURE`. Exit with a readable error if invalid.
2. **App factory** — `helmet`, `cors({ origin: CORS_ORIGINS, credentials: true })`,
   `express.json({ limit: '100kb' })`, `cookie-parser`, `morgan` (dev), rate limiter on `/api/auth`.
3. **Health** — `GET /api/health` → `{ status: 'ok', db: 'up' | 'down' }`.
4. **Errors** — `AppError(statusCode, code, message, details?)` with static helpers. A single
   `errorHandler` maps: `AppError`, `ZodError` (400), `MulterError` (413/400), Mongo `11000` (409),
   malformed JSON (400), everything else (500, logged, generic message).
5. **404** — unknown routes return the error envelope with `NOT_FOUND`.
6. **validate middleware** — `validate({ body?, params?, query? })` parses with Zod, replaces the
   request values with the parsed (coerced, trimmed) output, returns field-level `details`.
7. **Express 5** handles rejected promises from async handlers — no `asyncHandler` wrapper needed.
8. **Graceful shutdown** on `SIGINT`/`SIGTERM`: stop accepting connections, close Mongo client.

## Coding rules

- `strict: true`, no implicit `any`, no non-null assertions on user input.
- Controllers never touch `collections` directly.
- Services throw `AppError`; controllers never build error responses manually.
- Map DB documents to DTOs (`utils/mappers.ts`) — never leak `passwordHash` or raw ObjectIds.
