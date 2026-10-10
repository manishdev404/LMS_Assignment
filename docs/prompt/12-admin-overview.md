# 12 — Operations: Admin Overview

## Prompt

Admin can access every module (Sales, Sanction, Disbursement, Collection) through the same routes
as the executives — `MODULE_ACCESS` includes `ADMIN` everywhere. In addition, give the admin an
**Overview** page with portfolio KPIs and a searchable list of all loans.

## Endpoints (ADMIN only)

| Method | Path                                         | Result |
| ------ | -------------------------------------------- | ------ |
| GET    | `/api/admin/overview`                        | KPIs (below) |
| GET    | `/api/admin/loans?status=&search=&page=&limit=` | all loans, newest first |
| GET    | `/api/admin/loans/:loanId`                   | `{ loan, payments }` for the detail view |

Overview payload:

```ts
{
  loansByStatus: Record<LoanStatus, number>,
  leads: number,                       // registered borrowers with no loan
  totalDisbursed: number,              // Σ principal of DISBURSED + CLOSED
  totalCollected: number,              // Σ payments.amount
  outstanding: number,                 // Σ (totalRepayment − amountPaid) of DISBURSED
  staffByRole: Record<Role, number>
}
```

Computed with `$group` aggregations, run in parallel (`Promise.all`).

## UI

KPI cards, status distribution bar, quick links into each module, all-loans table with status
filter + search + pagination and a loan detail drawer (timeline + payments).
