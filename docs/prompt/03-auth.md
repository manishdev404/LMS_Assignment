# 03 — Authentication (JWT + bcrypt)

## Prompt

Implement sign-up and login for borrowers and login for internal staff. Passwords are hashed with
bcrypt. Issue a JWT and set it as an **httpOnly cookie** (Bearer header also accepted for API
clients). Borrower and staff sessions are separate "portals" so both apps can be used side by side
in one browser.

## Design decisions

| Decision | Choice | Reason |
| -------- | ------ | ------ |
| Hashing | `bcryptjs`, cost 10 | bcrypt algorithm, no native build step on Windows/CI |
| Token | JWT HS256, claims `{ sub, role, aud }` | stateless; `aud` = `borrower` \| `staff` |
| Transport | httpOnly `SameSite=Lax` cookie; `Authorization: Bearer` fallback | JS cannot read the token (XSS); Bearer for Postman/curl |
| Cookie names | `lms_borrower_session`, `lms_staff_session` | both apps share `localhost`; separate names stop sessions overwriting each other |
| Same-origin | each Next.js app rewrites `/api/*` → backend | cookies are first-party, no CORS preflights in the browser |
| User lookup | `authenticate` re-loads the user from DB each request | deleted users / changed roles take effect immediately |

## Endpoints

| Method | Path                              | Auth | Body                         | Success |
| ------ | --------------------------------- | ---- | ---------------------------- | ------- |
| POST   | `/api/auth/borrower/register`     | –    | `{ name, email, password }`  | 201 `{ user, token }` + cookie |
| POST   | `/api/auth/borrower/login`        | –    | `{ email, password }`        | 200 `{ user, token }` + cookie |
| POST   | `/api/auth/staff/login`           | –    | `{ email, password }`        | 200 `{ user, token }` + cookie |
| POST   | `/api/auth/:portal/logout`        | –    | –                            | 204, cookie cleared |
| GET    | `/api/auth/:portal/me`            | portal session | –                  | 200 `{ user }` |

`user` DTO: `{ id, name, email, role, createdAt }`.

## Validation (Zod)

- `name`: trimmed, 2–80 chars.
- `email`: valid email, lower-cased, ≤ 254 chars.
- `password` (register): 8–72 chars (bcrypt limit), at least one letter and one digit.
- `portal` param: `borrower` | `staff`.

## Rules

- Register always creates role `BORROWER` (roles are never accepted from the client).
- Duplicate email → `409 EMAIL_TAKEN`.
- Wrong email or password → `401 INVALID_CREDENTIALS` (same message for both; no user enumeration).
- Borrower portal login with a staff account, or staff login with a borrower account →
  `403 WRONG_PORTAL` with a message pointing to the correct app.
- `/api/auth` is rate-limited (e.g. 50 requests / 15 min / IP) → `429`.

## Middleware: `authenticate(portal)`

1. Read token from `Authorization: Bearer …` or the portal's cookie.
2. Missing → `401 UNAUTHENTICATED`. Invalid/expired/wrong audience → `401 INVALID_TOKEN`.
3. Load user by `sub`; missing → `401`. Attach `req.user = { id, name, email, role }`.

## Acceptance criteria

- Passwords never stored or logged in plain text; `passwordHash` never returned.
- Refreshing a protected page keeps the session (cookie persists for `JWT_EXPIRES_IN_HOURS`).
- Logging in to the borrower portal does not log out the ops dashboard and vice versa.
