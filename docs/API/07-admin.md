# Admin API

Access: **ADMIN** (staff session). Admin can also call every Sales, Sanction, Disbursement and
Collection endpoint.

## GET `/admin/overview`
**200**
```json
{
  "loansByStatus": { "APPLIED": 1, "SANCTIONED": 1, "REJECTED": 0, "DISBURSED": 1, "CLOSED": 0 },
  "leads": 3,
  "totalDisbursed": 100000,
  "totalCollected": 25000,
  "outstanding": 87000,
  "staffByRole": { "ADMIN": 1, "SALES": 1, "SANCTION": 1, "DISBURSEMENT": 1, "COLLECTION": 1 }
}
```

## GET `/admin/loans`
All loans, newest first. Query: `status` (optional), `page`, `limit`, `search`.

**200** `{ items: Loan[], pagination }` · **400** invalid `status`

## GET `/admin/loans/:loanId`
**200** `{ loan, payments }` · **404**
