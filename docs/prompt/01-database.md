# 01 — Database (MongoDB Atlas, native driver)

## Prompt

Design and implement the persistence layer for the LMS using **MongoDB Atlas** and the official
`mongodb` Node.js driver (no Mongoose). Provide typed collection accessors, idempotent index
creation, a GridFS bucket for salary slips and a transaction helper.

## Requirements

- `db/client.ts`: single shared `MongoClient`; `connectToDatabase()`, `getDb()`, `getClient()`,
  `disconnectFromDatabase()`. Connection string + DB name come from validated env
  (`MONGODB_URI`, `MONGODB_DB_NAME`).
- `db/collections.ts`: typed accessors, e.g. `collections.loans()` → `Collection<LoanDocument>`.
  Collection names live in one constant (`COLLECTIONS`).
- `db/indexes.ts`: `ensureIndexes()` run on server start and by the seed script.
- `db/gridfs.ts`: `GridFSBucket` named `salarySlips`.
- `db/transaction.ts`: `withTransaction(fn)` wrapper around `session.withTransaction`.
  Atlas clusters are replica sets, so multi-document transactions are available.

## Collections

### `users`
| Field          | Type     | Notes                                      |
| -------------- | -------- | ------------------------------------------ |
| `_id`          | ObjectId |                                            |
| `name`         | string   |                                            |
| `email`        | string   | lower-cased, **unique**                    |
| `passwordHash` | string   | bcrypt, never returned by the API          |
| `role`         | enum     | ADMIN / SALES / SANCTION / DISBURSEMENT / COLLECTION / BORROWER |
| `createdAt`, `updatedAt` | Date |                                      |

### `borrower_profiles` (1 : 1 with a BORROWER user)
| Field            | Type                    | Notes                                         |
| ---------------- | ----------------------- | --------------------------------------------- |
| `userId`         | ObjectId → users        | **unique**                                    |
| `fullName`       | string                  |                                               |
| `pan`            | string                  | upper-cased                                   |
| `dateOfBirth`    | Date                    | stored as UTC midnight of the calendar date   |
| `monthlySalary`  | number                  | rupees                                        |
| `employmentMode` | enum                    | SALARIED / SELF_EMPLOYED / UNEMPLOYED         |
| `bre`            | `{ eligible, age, failures[], evaluatedAt }` | last BRE run (kept for sales lead tracking) |
| `salarySlip`     | `{ fileId, originalName, mimeType, size, uploadedAt } \| null` | GridFS file id |

### `loans`
| Field              | Type                         | Notes                                        |
| ------------------ | ---------------------------- | -------------------------------------------- |
| `loanNumber`       | string                       | `LN000001` from `counters`, **unique**        |
| `borrowerId`       | ObjectId → users             |                                              |
| `applicant`        | snapshot                     | fullName, email, pan, dob, salary, employment at apply time |
| `salarySlip`       | snapshot                     | same shape as profile.salarySlip             |
| `principal`        | number                       | ₹50,000 – ₹5,00,000                          |
| `tenureDays`       | number                       | 30 – 365                                     |
| `interestRatePa`   | number                       | 12                                           |
| `simpleInterest`   | number                       | 2-dp                                         |
| `totalRepayment`   | number                       | principal + SI                               |
| `amountPaid`       | number                       | running total; outstanding is derived         |
| `status`           | enum                         | APPLIED / SANCTIONED / REJECTED / DISBURSED / CLOSED |
| `rejectionReason`  | string \| null               |                                              |
| `sanctionedAt/By`, `rejectedAt/By`, `disbursedAt/By`, `closedAt` | audit | `By` = `{ userId, name, role }` |
| `statusHistory`    | `{ status, at, by, note }[]` | full audit trail                              |

### `payments`
| Field         | Type             | Notes                            |
| ------------- | ---------------- | -------------------------------- |
| `loanId`      | ObjectId → loans |                                  |
| `borrowerId`  | ObjectId → users | denormalised for reporting       |
| `utr`         | string           | upper-cased, **globally unique**  |
| `amount`      | number           | 2-dp, > 0, ≤ outstanding         |
| `paymentDate` | Date             |                                  |
| `recordedBy`  | actor snapshot   |                                  |

### `counters`
`{ _id: "loanNumber", seq: number }` — atomic `$inc` with upsert for human-friendly loan numbers.

### GridFS bucket `salarySlips`
`salarySlips.files` / `salarySlips.chunks`; metadata `{ userId, originalName }`.

## Indexes (all created by `ensureIndexes`)

| Collection          | Index                                                          | Why                                        |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| users               | `{ email: 1 }` unique                                          | login lookup, no duplicate accounts        |
| users               | `{ role: 1, createdAt: -1 }`                                   | sales leads listing                        |
| borrower_profiles   | `{ userId: 1 }` unique                                         | 1:1 with user                              |
| borrower_profiles   | `{ pan: 1 }` unique, partial `{ "bre.eligible": true }`        | one eligible profile per PAN               |
| loans               | `{ loanNumber: 1 }` unique                                     |                                            |
| loans               | `{ borrowerId: 1 }` unique, partial `{ status ∈ APPLIED, SANCTIONED, DISBURSED }` | **DB-level guarantee: one active loan per borrower** |
| loans               | `{ status: 1, createdAt: -1 }`                                 | module queues                              |
| payments            | `{ utr: 1 }` unique                                            | **no duplicate UTR across all payments**   |
| payments            | `{ loanId: 1, paymentDate: -1 }`                               | payment history per loan                   |

## Acceptance criteria

- Server refuses to start if Mongo is unreachable or env is invalid (clear log message).
- Duplicate-key errors (code `11000`) are translated to `409` by the error handler.
- No collection access outside `services/` and `scripts/`.
