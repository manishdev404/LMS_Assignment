# LMS API

Base URL: `http://localhost:4000/api` (the Next.js apps proxy `/api/*` to it).

| Module | File | Access |
| ------ | ---- | ------ |
| Auth | [01-auth.md](01-auth.md) | public / any signed-in user |
| Borrower | [02-borrower.md](02-borrower.md) | BORROWER |
| Sales | [03-sales.md](03-sales.md) | SALES, ADMIN |
| Sanction | [04-sanction.md](04-sanction.md) | SANCTION, ADMIN |
| Disbursement | [05-disbursement.md](05-disbursement.md) | DISBURSEMENT, ADMIN |
| Collection | [06-collection.md](06-collection.md) | COLLECTION, ADMIN |
| Admin | [07-admin.md](07-admin.md) | ADMIN |

`GET /health` → `200 { status: "ok", db: "up" }` (503 when the DB is down).

## Authentication

Login sets an httpOnly cookie (`lms_borrower_session` or `lms_staff_session`) and also returns
`token`. API clients can send `Authorization: Bearer <token>` instead of the cookie.

## Response format

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [] } }
```

Paginated lists return `data: { items: [], pagination: { page, limit, total, totalPages } }` and
accept `?page=1&limit=10&search=`.

## Status codes

| Code | Meaning |
| ---- | ------- |
| 200 / 201 / 204 | OK / created / no content |
| 400 | `VALIDATION_ERROR` — `details: [{ location, field, message }]` |
| 401 | not signed in, invalid or expired token |
| 403 | signed in but role not allowed (`FORBIDDEN`, `WRONG_PORTAL`) |
| 404 | not found (also for another borrower's loan) |
| 409 | conflict — `INVALID_STATUS_TRANSITION`, `ACTIVE_LOAN_EXISTS`, `DUPLICATE_UTR`, `EMAIL_TAKEN`, … |
| 413 / 415 | file too large / unsupported file type |
| 422 | business rule — `BRE_REJECTED`, `AMOUNT_EXCEEDS_OUTSTANDING`, `INVALID_PAYMENT_DATE` |
| 429 | too many login / sign-up attempts |

## Loan status flow

```
APPLIED ──approve──▶ SANCTIONED ──disburse──▶ DISBURSED ──full repayment──▶ CLOSED
   └─────reject────▶ REJECTED
```
