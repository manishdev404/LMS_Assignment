# 08 — Operations Module: Sales (lead tracking)

## Prompt

Build the Sales module: it tracks the **pre-application** funnel — borrowers who registered but
have **not applied for a loan yet**. Accessible to `SALES` and `ADMIN`.

## Lead stage (derived, not stored)

| Stage                | Condition                                         |
| -------------------- | ------------------------------------------------- |
| `REGISTERED`         | user exists, no borrower profile                  |
| `BRE_REJECTED`       | profile exists, last BRE run failed (show reasons) |
| `DETAILS_SUBMITTED`  | BRE passed, no salary slip                        |
| `DOCUMENT_UPLOADED`  | slip uploaded, loan not applied yet (hottest leads) |

Deriving the stage in an aggregation keeps it always consistent with the real data.

## Endpoint

`GET /api/sales/leads?stage=&search=&page=1&limit=10`

- Aggregation on `users` (role BORROWER) → `$lookup` loans (keep only users with **zero** loans)
  → `$lookup` borrower_profiles → `$addFields stage` → `$facet` for items, total and per-stage counts.
- `search` matches name, email, PAN or profile full name (regex-escaped, case-insensitive).
- Response: `{ items: Lead[], pagination, stageCounts: Record<LeadStage, number> }`.
- `Lead = { userId, name, email, registeredAt, stage, profile?: { fullName, pan, monthlySalary,
  employmentMode, age, breFailures[], salarySlipUploaded, updatedAt } }`.

## UI

- Stage counter cards (click = filter), search box, paginated table:
  name/email, registered date, stage badge, salary/employment, BRE failure reasons.
- Read-only module — the actionable output for sales is "who to call and why".

## Access

`router.use(authenticate('staff'), authorize(ADMIN, SALES))`.
