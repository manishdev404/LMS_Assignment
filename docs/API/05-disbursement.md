# Disbursement API

Access: **DISBURSEMENT, ADMIN** (staff session).

## GET `/disbursement/loans`
Loans in **SANCTIONED** status, oldest sanction first. Query: `page`, `limit`, `search`.

**200** `{ items: Loan[], pagination }`

## POST `/disbursement/loans/:loanId/disburse`
SANCTIONED → **DISBURSED**. Funds are released and the loan moves to the Collection queue.
```json
{ "note": "Released via NEFT" }
```
`note` is optional.

**200** `{ loan }` (`disbursedAt`, `disbursedBy`, `outstanding = totalRepayment`) ·
**404** · **409** `INVALID_STATUS_TRANSITION` (not SANCTIONED)
