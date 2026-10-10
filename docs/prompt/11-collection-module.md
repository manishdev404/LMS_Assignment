# 11 — Operations Module: Collection

## Prompt

Build the Collection module: the executive records borrower payments against **DISBURSED**
loans. When the total paid equals the total repayment the loan **auto-closes** (`CLOSED`).
Accessible to `COLLECTION` and `ADMIN`.

## Payment fields

| Field         | Validation |
| ------------- | ---------- |
| `utr`         | trimmed, upper-cased, alphanumeric, 12–22 chars (IMPS 12, NEFT 16, RTGS 22); **unique across all payments** |
| `amount`      | number > 0, max 2 decimals, **≤ outstanding** |
| `paymentDate` | `YYYY-MM-DD`; not in the future; not before the loan's disbursement date |

## Outstanding balance

- Loan stores `totalRepayment` and a running `amountPaid`; `outstanding = totalRepayment − amountPaid`
  is derived in the DTO (never stored twice, can't drift).
- All arithmetic in **integer paise** (`toPaise`, `fromPaise`) — no float errors like 0.1 + 0.2.

## Recording a payment (one MongoDB transaction)

1. Load loan **inside the transaction**; must be `DISBURSED` → else `409 INVALID_STATUS_TRANSITION`.
2. `amount ≤ outstanding` → else `422 AMOUNT_EXCEEDS_OUTSTANDING` (message includes the outstanding).
3. `paymentDate ≥ disbursedAt` (date part) → else `422`.
4. Insert payment (unique index on `utr` → `409 DUPLICATE_UTR`; also pre-checked for a nicer message).
5. Update loan with an optimistic guard `{ _id, status: DISBURSED, amountPaid: <value read> }` →
   `$set amountPaid = paid + amount`; if it now equals `totalRepayment` also set
   `status: CLOSED, closedAt` and push `CLOSED` to `statusHistory` (actor = collection executive,
   note "Auto-closed on full repayment").
6. Any failure aborts the transaction — payment and loan never disagree.

## Endpoints

| Method | Path                                                 | Result |
| ------ | ---------------------------------------------------- | ------ |
| GET    | `/api/collection/loans?view=active\|closed&search=&page=&limit=` | DISBURSED (default) or CLOSED loans with paid / outstanding |
| GET    | `/api/collection/loans/:loanId/payments`             | `{ loan, payments[] }` |
| POST   | `/api/collection/loans/:loanId/payments`             | 201 `{ payment, loan, loanClosed }` |

## UI

- Tabs Active / Closed, table with total, paid, outstanding and a progress bar.
- "Record payment" dialog: UTR, amount (pre-filled helper "Pay full outstanding"), date
  (defaults to today, max today); shows the payment history for the loan.
- After a closing payment → toast "Loan LN000123 fully repaid and closed".
