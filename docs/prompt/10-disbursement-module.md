# 10 — Operations Module: Disbursement

## Prompt

Build the Disbursement module: the executive sees **SANCTIONED** loans and marks a loan as
disbursed (funds released). The next status is **`DISBURSED`** — the loan becomes active and
enters the Collection queue. Accessible to `DISBURSEMENT` and `ADMIN`.

## Transition

```
SANCTIONED ──disburse──▶ DISBURSED   (disbursedAt, disbursedBy)
```

Uses the shared `transitionLoan` state machine (atomic, role-checked; see `09-sanction-module.md`).

## Endpoints

| Method | Path                                          | Body        | Result |
| ------ | --------------------------------------------- | ----------- | ------ |
| GET    | `/api/disbursement/loans?search=&page=&limit=` | –           | SANCTIONED queue, oldest sanction first |
| POST   | `/api/disbursement/loans/:loanId/disburse`    | `{ note? }` | 200 `{ loan }` |

## UI

- Queue table: loan no., borrower, principal (amount to release), tenure, total repayment,
  sanctioned date + sanctioned by.
- "Mark disbursed" → confirm dialog showing the amount → toast.

## Acceptance criteria

- Disbursing an APPLIED / REJECTED / already-DISBURSED loan → `409 INVALID_STATUS_TRANSITION`.
- After disbursing, the loan appears in Collection with outstanding = total repayment.
