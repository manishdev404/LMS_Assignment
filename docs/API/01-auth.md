# Auth API

`:portal` is `borrower` (Borrower Portal) or `staff` (Operations Dashboard).

## POST `/auth/borrower/register`
Creates a **BORROWER** account and signs in.

```json
{ "name": "Riya Sharma", "email": "riya@example.com", "password": "Passw0rd" }
```
Password: 8–72 chars, at least one letter and one digit.

**201** `{ user, token }` + cookie · **400** validation · **409** `EMAIL_TAKEN`

## POST `/auth/:portal/login`
```json
{ "email": "admin@lms.dev", "password": "Admin@123" }
```
**200** `{ user, token }` + cookie · **401** `INVALID_CREDENTIALS` ·
**403** `WRONG_PORTAL` (e.g. borrower signing in on `staff`) · **429** rate limited

`user`: `{ id, name, email, role, createdAt }`

## POST `/auth/:portal/logout`
Clears the portal's cookie. **204**

## GET `/auth/:portal/me`
**200** `{ user }` · **401** no or invalid session
