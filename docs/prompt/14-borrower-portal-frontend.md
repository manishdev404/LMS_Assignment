# 14 — Frontend: Borrower Portal (`Borrower_Portal/`, Next.js 16, port 3000)

## Prompt

Build the borrower-facing app: landing → sign up / login → 4-step application wizard → my loans.
Responsive (mobile-first), accessible, Tailwind CSS v4.

## Routes

| Route        | Access   | Purpose |
| ------------ | -------- | ------- |
| `/`          | public   | Landing: product summary (₹50K–₹5L, 30–365 days, 12% p.a.), CTA |
| `/register`  | guest    | Sign up (name, email, password + confirm) |
| `/login`     | guest    | Login; supports `?next=` |
| `/apply`     | BORROWER | Wizard: Personal details → Salary slip → Loan config & apply |
| `/my-loans`  | BORROWER | Loans with status timeline, repayment progress, payments |

## Architecture

```
src/
├── app/                       # routes above (+ layout, not-found)
├── components/
│   ├── ui/                    # Button, Field/Input/Select, Card, Alert, StatusBadge, Spinner, icons
│   ├── layout/                # SiteHeader
│   ├── auth/                  # AuthCard, LoginForm, RegisterForm
│   ├── apply/                 # Stepper, PersonalDetailsStep, EligibilityChecklist, SalarySlipStep,
│   │                          # LoanConfigStep (+ RangeField, live summary), ApplicationResult
│   └── loans/                 # LoanCard (repayment progress + payments), StatusTimeline
├── context/auth-context.tsx   # user, login, register, logout (calls /api/auth/borrower/*)
├── lib/                       # api.ts (fetch + XHR upload), loan-math.ts, eligibility.ts, format.ts,
│                              # session.ts, navigation.ts
├── types/api.ts               # DTO types mirroring the backend
└── proxy.ts                   # optimistic route protection (Next.js 16 "proxy")
```

- `next.config.ts` rewrites `/api/:path*` → `${BACKEND_URL}/api/:path*` (same-origin cookies).
- `proxy.ts` decodes `lms_borrower_session` (no secret, no DB): protected routes need a non-expired
  BORROWER session; logged-in users visiting `/login` or `/register` go to `/apply`.
- `lib/api.ts`: typed `apiRequest<T>()` that unwraps the envelope and throws `ApiError
  { status, code, message, details }`; 401 → redirect to `/login`.

## Wizard behaviour

- On load: `GET /api/borrower/application` decides the starting step (`nextStep`). Active loan →
  show "application in progress" card linking to My Loans.
- Step 2: controlled form, field errors from the API's `details`, live **eligibility checklist**
  (client mirror of the BRE using `config.eligibility`). Submit → server BRE; `422` shows a red
  panel listing every failed rule.
- Step 3: drag & drop, type/size checks, XHR progress, "View" opens the uploaded file.
- Step 4: sliders bound to `config.loan`, live SI panel (same formula as server), Apply → success.
- Completed steps are clickable to go back and edit (until a loan is applied).

## UX

INR formatting (`en-IN`), skeleton/spinner while loading, disabled buttons while submitting,
keyboard-accessible sliders, works at 360 px width.
