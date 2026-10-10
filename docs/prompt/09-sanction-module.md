# 09 — Operations Module: Sanction

## Prompt

Build the Sanction module: the sanction executive reviews **APPLIED** loans and either
**approves** (→ `SANCTIONED`) or **rejects with a reason** (→ `REJECTED`). Accessible to
`SANCTION` and `ADMIN`.

## Status transitions handled here

```
APPLIED ──approve──▶ SANCTIONED      (sanctionedAt, sanctionedBy)
APPLIED ──reject───▶ REJECTED        (rejectedAt, rejectedBy, rejectionReason)  — terminal
```

## Shared state machine (`constants/loan.ts` + `services/loan.service.ts`)

```ts
LOAN_TRANSITIONS = {
  APPLIED:    { SANCTIONED: [ADMIN, SANCTION], REJECTED: [ADMIN, SANCTION] },
  SANCTIONED: { DISBURSED:  [ADMIN, DISBURSEMENT] },
  DISBURSED:  { CLOSED:     [ADMIN, COLLECTION] },   // automatic on full repayment
  REJECTED:   {},
  CLOSED:     {},
}
```

`transitionLoan({ loanId, from, to, actor, set, note })`:
1. Check `LOAN_TRANSITIONS[from][to]` includes `actor.role` → else `403`.
2. `findOneAndUpdate({ _id, status: from }, { $set: { status: to, …set }, $push: { statusHistory } })`
   — the status in the filter makes the transition **atomic** (two executives clicking at once:
   one wins, the other gets `409 INVALID_STATUS_TRANSITION`).
3. Not matched → `404` if the loan doesn't exist, else `409` with the current status.

## Endpoints

| Method | Path                                       | Body          | Result |
| ------ | ------------------------------------------ | ------------- | ------ |
| GET    | `/api/sanction/loans?search=&page=&limit=` | –             | APPLIED queue, oldest first (FIFO) |
| GET    | `/api/sanction/loans/:loanId/salary-slip`  | –             | stream slip for review |
| POST   | `/api/sanction/loans/:loanId/approve`      | `{ note? }`   | 200 `{ loan }` |
| POST   | `/api/sanction/loans/:loanId/reject`       | `{ reason }`  | 200 `{ loan }` |

`reason`: trimmed, 5–500 chars, required.

## UI

- Queue table: loan no., applicant (name, PAN, age, salary, employment), amount, tenure, total
  repayment, applied date, "View slip".
- Approve → confirm dialog. Reject → dialog with required reason textarea (min 5 chars).
- Row disappears from the queue after action; toast confirms.
