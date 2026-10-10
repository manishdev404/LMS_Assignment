# 04 — Role-Based Access Control (frontend + backend)

## Prompt

Enforce RBAC in three layers. Hiding menu items is not enough — the API must reject unauthorized
requests on its own.

## Roles and module access

| Role         | Borrower Portal | Overview | Sales | Sanction | Disbursement | Collection |
| ------------ | :-------------: | :------: | :---: | :------: | :----------: | :--------: |
| ADMIN        |                 | ✅       | ✅    | ✅       | ✅           | ✅         |
| SALES        |                 |          | ✅    |          |              |            |
| SANCTION     |                 |          |       | ✅       |              |            |
| DISBURSEMENT |                 |          |       |          | ✅           |            |
| COLLECTION   |                 |          |       |          |              | ✅         |
| BORROWER     | ✅              |          |       |          |              |            |

## Backend (authoritative)

- Roles stored as a string enum on `users.role`; constants in `constants/roles.ts`:
  `ROLES`, `STAFF_ROLES`, and `MODULE_ACCESS = { sales: [ADMIN, SALES], sanction: [ADMIN, SANCTION], … }`.
- Router-level chain: `router.use(authenticate('staff'), authorize(...MODULE_ACCESS.sanction))`.
- `authorize(...roles)` → `403 FORBIDDEN` when `req.user.role` is not in the list.
- `401` = not authenticated (no/invalid token). `403` = authenticated but not allowed.
- Borrower routes: `authenticate('borrower'), authorize(BORROWER)`; every query is scoped by
  `borrowerId = req.user.id`, so a borrower can never read another borrower's data (404, not 403,
  for other people's loan ids — don't reveal existence).
- Status transitions double-check the role in the service-level state machine
  (`LOAN_TRANSITIONS[from][to].allowedRoles`).

## Frontend — layer 1: `proxy.ts` (Next.js 16, formerly middleware)

- Optimistic check, runs before render: decode the session cookie (no DB call), check `exp`,
  `aud` and `role` against a route → roles map.
- No/expired session → redirect to `/login?next=<path>`.
- Wrong role → redirect to `/forbidden` (dashboard) — Borrower Portal only admits `BORROWER`.
- Already logged-in user on `/login` → redirect to their home module.

## Frontend — layer 2: UI

- `AuthProvider` fetches `/api/auth/<portal>/me` (signature verified by the backend).
- Sidebar shows only modules the role may open.
- Each module page is wrapped in `<RequireRole module="sanction">` (roles come from `lib/rbac.ts`),
  which renders a 403 state if the role does not match (defence in depth if a cookie was tampered with).
- Any `401` from the API → redirect to login; `403` → toast + forbidden state.

## Acceptance criteria

- `curl` with a SALES token against `POST /api/sanction/loans/:id/approve` → `403`.
- Visiting `/collection` as SANCTION → redirected to `/forbidden`.
- A BORROWER token on any staff route → `401` (wrong audience) or `403` (wrong role).
