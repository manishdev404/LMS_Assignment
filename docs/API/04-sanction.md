# Sanction API

Access: **SANCTION, ADMIN** (staff session).

## GET `/sanction/loans`
Loans in **APPLIED** status, oldest first. Query: `page`, `limit`, `search` (loan no., name, email, PAN).

**200** `{ items: Loan[], pagination }`

## GET `/sanction/loans/:loanId/salary-slip`
Streams the salary slip attached to the loan. **200** file · **404**

## POST `/sanction/loans/:loanId/approve`
APPLIED → **SANCTIONED**.
```json
{ "note": "Documents verified" }
```
`note` is optional, max 500 characters.

**200** `{ loan }` · **404** · **409** `INVALID_STATUS_TRANSITION` (not APPLIED)

## POST `/sanction/loans/:loanId/reject`
APPLIED → **REJECTED** (final).
```json
{ "reason": "Salary slip does not match declared income" }
```
`reason` is required, 5–500 characters.

**200** `{ loan }` (with `rejectionReason`) · **400** missing or short reason · **409** `INVALID_STATUS_TRANSITION`
