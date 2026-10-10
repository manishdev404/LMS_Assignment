# Collection API

Access: **COLLECTION, ADMIN** (staff session).

## GET `/collection/loans`
Query: `view=active` (default, **DISBURSED**) or `view=closed` (**CLOSED**), `page`, `limit`, `search`.

**200** `{ items: Loan[], pagination }`. Each loan has `totalRepayment`, `amountPaid` and `outstanding`.

## GET `/collection/loans/:loanId/payments`
**200** `{ loan, payments: [{ id, loanId, utr, amount, paymentDate, recordedBy, createdAt }] }` ·
**404** loan not disbursed yet

## POST `/collection/loans/:loanId/payments`
Records a payment. When the total paid reaches the total repayment, the loan **auto-closes**.
```json
{ "utr": "SBIN0001234567AB", "amount": 25000, "paymentDate": "2026-10-10" }
```

| Field | Rule |
| ----- | ---- |
| `utr` | 12–22 letters/digits, stored in upper case, **unique across all payments** |
| `amount` | > 0, max 2 decimals, ≤ outstanding |
| `paymentDate` | `YYYY-MM-DD`, not in the future, not before the disbursement date |

**201**
```json
{ "payment": { }, "loan": { "status": "CLOSED", "outstanding": 0 }, "loanClosed": true }
```
**400** validation · **404** · **409** `DUPLICATE_UTR`, `INVALID_STATUS_TRANSITION` (loan not DISBURSED) ·
**422** `AMOUNT_EXCEEDS_OUTSTANDING` (`details.outstanding`), `INVALID_PAYMENT_DATE`
