# 07 — Borrower Step 4: Loan Configuration & Apply

## Prompt

Let the borrower choose a **loan amount** and **tenure** with sliders, show a live calculation
panel, and create the loan in the pending (`APPLIED`) status when they click **Apply**.

## Limits (single source of truth: `constants/loan.ts`, exposed via `GET /api/borrower/application → config.loan`)

| Parameter  | Min      | Max        | Slider step |
| ---------- | -------- | ---------- | ----------- |
| Amount (₹) | 50,000   | 5,00,000   | 1,000       |
| Tenure     | 30 days  | 365 days   | 1 day       |
| Rate       | 12 % p.a. fixed |     |             |

## Math (Simple Interest)

```
SI              = (P × R × T) / (365 × 100)      T = tenure in days, R = 12
Total Repayment = P + SI
```

- Round SI to 2 decimals (half-up) once; total = P + rounded SI. Same function on server
  (`utils/loan-math.ts`) and client (`lib/loan-math.ts`).
- Examples: P = 1,00,000, T = 365 → SI = 12,000.00, total = 1,12,000.00.
  P = 50,000, T = 30 → SI = 493.15, total = 50,493.15.
- Unit tests cover min/max bounds and rounding.

## Endpoint

`POST /api/borrower/loans` body `{ principal: integer, tenureDays: integer }`

Server steps:
1. Validate ranges (400).
2. Load profile → must exist, BRE eligible, salary slip uploaded (else `409 PROFILE_INCOMPLETE`).
3. **Re-run the BRE** on the stored profile (age may have changed since) → `422 BRE_REJECTED`.
4. No active loan (`APPLIED | SANCTIONED | DISBURSED`) → else `409 ACTIVE_LOAN_EXISTS`. Also
   guaranteed by a partial unique index (handles double-click races).
5. Compute SI/total on the server — **never trust client-computed money**.
6. Generate `loanNumber` from the `counters` collection.
7. Insert loan with `status: APPLIED`, applicant + slip snapshots, `amountPaid: 0`,
   `statusHistory: [{ status: APPLIED, by: borrower }]` → `201 { loan }`.

Other borrower endpoints:
- `GET /api/borrower/loans` — own loans, newest first.
- `GET /api/borrower/loans/:loanId` — own loan + payments (404 for someone else's id).

## Frontend

- Two range sliders + numeric read-outs, live panel: principal, rate, tenure, interest, total,
  and a per-day interest hint. Values are formatted with `en-IN` currency.
- Apply button disabled while submitting; success screen links to "My Loans" where the status
  timeline (`APPLIED → SANCTIONED → DISBURSED → CLOSED`) and repayment progress are shown.
