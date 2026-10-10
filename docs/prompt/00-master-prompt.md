# 00 — Master Prompt: Loan Management System (LMS)

> Use this prompt first. Every module prompt in this folder (`01-…` → `16-…`) assumes the
> context, conventions and decisions defined here.

## Role

You are a senior full-stack engineer. Build a production-quality **Loan Management System**:
borrowers apply for short-tenure personal loans and internal executives move those loans through
their lifecycle (`APPLIED → SANCTIONED → DISBURSED → CLOSED`, or `APPLIED → REJECTED`).

## Repository layout (one root folder, three apps)

```
assesment-cashbee/
├── backend/                 # ONE Express + TypeScript API used by both frontends
├── Borrower_Portal/         # Next.js (App Router) — borrower journey          :3000
├── Operations_Dashboard/    # Next.js (App Router) — internal ops dashboard    :3001
├── docs/prompt/             # these prompts (design + build instructions per module)
└── README.md
```

## Tech stack (fixed)

| Layer      | Choice                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4                    |
| Backend    | Node.js + Express 5 + TypeScript                                          |
| Database   | **MongoDB Atlas (cloud)** via the official `mongodb` driver — **no Mongoose** |
| Validation | Zod (request bodies, params, query, env)                                  |
| Auth       | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`), httpOnly cookie or Bearer     |
| Files      | Multer (memory) → MongoDB **GridFS** bucket `salarySlips`                 |

## Backend layering (mandatory)

Every feature is split across these folders — no business logic in routes or controllers:

| Folder         | Responsibility                                                              |
| -------------- | --------------------------------------------------------------------------- |
| `config/`      | Env loading + validation (fail fast on bad config)                          |
| `db/`          | Mongo client, typed collection accessors, indexes, GridFS, transactions      |
| `interfaces/`  | TypeScript interfaces: DB documents, DTOs, auth types, API envelopes         |
| `constants/`   | Roles, loan statuses + transition map, BRE thresholds, loan limits          |
| `validations/` | Zod schemas per module (body / params / query)                              |
| `middlewares/` | `authenticate`, `authorize` (RBAC), `validate`, `upload`, errors, 404        |
| `services/`    | All business logic + DB access. Pure functions where possible (BRE, math)    |
| `controllers/` | Thin: read validated input → call service → send envelope                   |
| `routes/`      | Wire path + middleware chain + controller; one router per module            |
| `utils/`       | `AppError`, response helpers, JWT, password, money, dates, mappers           |
| `scripts/`     | `seed.ts`                                                                    |

## API conventions

- Base path `/api`. JSON in/out (except file upload/download).
- Success envelope: `{ "success": true, "data": <payload> }`
- Error envelope: `{ "success": false, "error": { "code": "<CODE>", "message": "<human text>", "details"?: <any> } }`
- Lists: `data = { items: [...], pagination: { page, limit, total, totalPages } }`
- Status codes:
  `200` ok · `201` created · `204` no content · `400` VALIDATION_ERROR · `401` UNAUTHENTICATED ·
  `403` FORBIDDEN · `404` NOT_FOUND · `409` CONFLICT / INVALID_STATUS_TRANSITION / DUPLICATE ·
  `413` FILE_TOO_LARGE · `415` UNSUPPORTED_FILE_TYPE · `422` BRE_REJECTED / business rule ·
  `429` RATE_LIMITED · `500` INTERNAL_ERROR
- Money is stored in rupees rounded to 2 decimals; all money arithmetic is done in **integer paise**
  to avoid floating-point drift.

## Roles

`ADMIN`, `SALES`, `SANCTION`, `DISBURSEMENT`, `COLLECTION`, `BORROWER` — stored as a string enum
on the user document. Admin can access every dashboard module; each executive only their own;
borrowers only the borrower portal.

## Build order

1. `01-database` → `02-backend-foundation` → `03-auth` → `04-rbac`
2. Borrower journey: `05` (details + BRE) → `06` (salary slip) → `07` (loan config + apply)
3. Ops modules: `08` sales → `09` sanction → `10` disbursement → `11` collection → `12` admin
4. `13` seed script
5. Frontends: `14` Borrower Portal → `15` Operations Dashboard
6. `16` README + submission

## Definition of done

- The complete flow works end-to-end: register → details (BRE pass & fail) → upload slip →
  apply → sanction → disburse → record payments → loan auto-closes.
- `npm run typecheck` and `npm run build` pass in all three apps; no `any` leaks in public APIs.
- RBAC enforced on the frontend (proxy + UI) **and** the backend (middleware).
- Seed script creates one account per role with known credentials.
