# 13 — Seed Script

## Prompt

Create `backend/src/scripts/seed.ts` (`npm run seed`) that pre-creates **one account per role**
with known credentials so an evaluator can log in to every role immediately. Optional
`npm run seed:demo` also creates demo borrowers spread across every lifecycle stage.

## Accounts (idempotent upsert by email — re-running resets the password)

| Role         | Email                  | Password        | App |
| ------------ | ---------------------- | --------------- | --- |
| ADMIN        | admin@lms.dev          | Admin@123       | Operations Dashboard |
| SALES        | sales@lms.dev          | Sales@123       | Operations Dashboard |
| SANCTION     | sanction@lms.dev       | Sanction@123    | Operations Dashboard |
| DISBURSEMENT | disbursement@lms.dev   | Disburse@123    | Operations Dashboard |
| COLLECTION   | collection@lms.dev     | Collect@123     | Operations Dashboard |
| BORROWER     | borrower@lms.dev       | Borrower@123    | Borrower Portal (clean — walk the full journey) |

## `--demo` data (password `Borrower@123` for all)

| Email                       | State |
| --------------------------- | ----- |
| lead.new@lms.dev            | Registered only (Sales: REGISTERED) |
| lead.rejected@lms.dev       | BRE failed — salary ₹18,000 (Sales: BRE_REJECTED) |
| lead.ready@lms.dev          | BRE passed + slip uploaded (Sales: DOCUMENT_UPLOADED) |
| applied@lms.dev             | Loan APPLIED (Sanction queue) |
| sanctioned@lms.dev          | Loan SANCTIONED (Disbursement queue) |
| active@lms.dev              | Loan DISBURSED with one part-payment (Collection queue) |

Demo data is created through the same pure functions as the API (`evaluateEligibility`,
`calculateLoan`) and a tiny generated PDF in GridFS, so numbers are identical to real flows.
Demo borrowers are skipped if they already exist (safe to re-run).

## Requirements

- Calls `ensureIndexes()` first. Uses bcrypt like the API. Prints a credentials table.
- Exits non-zero on failure; always closes the Mongo client.
