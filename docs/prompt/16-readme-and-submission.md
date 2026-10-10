# 16 — README, Repo Hygiene & Submission

## Prompt

Write the root `README.md` and per-app `.env.example` files so an evaluator can clone, configure
MongoDB Atlas, seed, and run all three apps in minutes.

## README sections

1. Overview + architecture diagram (3 apps, 1 API, Atlas).
2. Tech stack.
3. Prerequisites (Node ≥ 20, an Atlas cluster / connection string).
4. Setup: install → copy `.env.example` → seed → run (backend :4000, portal :3000, dashboard :3001).
5. **Login credentials** for every role (table from `13-seed-script.md`).
6. Feature walkthrough mapped to the assignment (borrower journey, 4 modules).
7. Design decisions: data model, loan state machine, BRE (PAN regex + client/server), money in
   paise, transactions, RBAC layers + status codes, cookies vs headers, GridFS.
8. API reference table.
9. Project structure.
10. Scripts (`dev`, `build`, `start`, `typecheck`, `seed`, `seed:demo`, `test`).
11. Demo video checklist (BRE fail → BRE pass → upload → apply → approve → disburse → pay → close).

## Hygiene

- Root `.gitignore`: `node_modules`, `.next`, `dist`, `.env*` (except `.env.example`), logs.
- No secrets committed; `.env.example` has placeholders only.
- Each app has `npm run typecheck`; backend has unit tests for BRE + loan math.

## Submission checklist

- [ ] GitHub repo (public or evaluator added) with README + `.env.example`
- [ ] 3–5 min video: borrower BRE fail & pass → apply → approve → disburse → payment → closed
- [ ] Credentials table for all roles
