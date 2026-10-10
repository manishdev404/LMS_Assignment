# 05 — Borrower Step 2: Personal Details + Business Rule Engine (BRE)

## Prompt

Collect the borrower's personal details and run the **Business Rule Engine on the server**. If any
rule fails, block the application and show every failed rule with a clear message.

## Input

| Field            | Validation (400 if malformed)                                    |
| ---------------- | ---------------------------------------------------------------- |
| `fullName`       | trimmed, 2–100 chars, letters / spaces / `.'-`                   |
| `pan`            | trimmed, upper-cased, 1–20 chars (format itself is a BRE rule)   |
| `dateOfBirth`    | `YYYY-MM-DD`, real calendar date, not in the future, after 1900   |
| `monthlySalary`  | number ≥ 0, ≤ 1 crore, max 2 decimals                            |
| `employmentMode` | `SALARIED` \| `SELF_EMPLOYED` \| `UNEMPLOYED`                    |

Schema validation only rejects *malformed* input. Eligibility (age, salary, PAN format,
employment) is decided by the BRE so the user gets a BRE decision, not a generic form error.

## BRE rules (all must pass)

| Rule         | Rejected when                                       | Message example |
| ------------ | --------------------------------------------------- | --------------- |
| `AGE`        | age < 23 or age > 50 (completed years, IST calendar) | "Applicant age is 21; must be between 23 and 50." |
| `SALARY`     | monthly salary < ₹25,000                            | "Monthly salary ₹20,000 is below the minimum of ₹25,000." |
| `PAN`        | not `^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$`                 | "PAN must look like ABCPE1234F …" |
| `EMPLOYMENT` | employment mode is `UNEMPLOYED`                     | "Unemployed applicants are not eligible." |

### Why this PAN regex?

A PAN is `AAAAA9999A`: 3 letters (series) + 1 letter **holder type** + 1 letter (surname initial)
+ 4 digits + 1 check letter. The 4th character is `P` for an individual (C = company, H = HUF,
F = firm, T = trust …). A personal loan can only be taken by an individual, so
`^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$` is the correct pattern — the looser `^[A-Z]{5}[0-9]{4}[A-Z]$`
would accept company PANs. Input is trimmed and upper-cased before matching.

### Where should the BRE live?

**Both, with the server authoritative.**
- Server: the decision that gates the loan. Client code can be bypassed (curl, devtools), so the
  server re-runs the BRE on submit **and again when the loan is applied**.
- Client: a live eligibility checklist using the same thresholds (served by the API in
  `config.eligibility`) for instant feedback — UX only, never trusted.

## Implementation

- `services/bre.service.ts`: pure `evaluateEligibility(input, today)` → `{ eligible, age, failures[] }`.
  Unit-tested on the age boundaries (22/23/50/51, birthday today/tomorrow), salary 24,999.99/25,000,
  PAN samples, and all employment modes.
- `utils/date.ts`: `calculateAge(dob, today)` in completed years using the `Asia/Kolkata` calendar date.

## Endpoints

| Method | Path                          | Notes |
| ------ | ----------------------------- | ----- |
| GET    | `/api/borrower/application`   | `{ profile, activeLoan, nextStep, config }` — drives the wizard |
| PUT    | `/api/borrower/profile`       | upsert details, run BRE |

`PUT /api/borrower/profile` behaviour:
- Persist the details **and the BRE result** in every case (sales sees BRE-rejected leads + reasons).
- Eligible → `200 { profile }`.
- Not eligible → `422 BRE_REJECTED` with `details: { failures: [{ rule, message }], age }`.
- Borrower has an active loan → `409 ACTIVE_LOAN_EXISTS` (details are frozen while a loan is live).
- PAN already used by another *eligible* profile → `409 PAN_IN_USE`.

`nextStep` values: `PERSONAL_DETAILS` → `SALARY_SLIP` → `LOAN_CONFIG` → `TRACK_LOAN`.

## Acceptance criteria

- DOB making the applicant 22 → blocked with an age message; 23 → passes.
- Salary 24,999 → blocked; 25,000 → passes.
- `ABCDE1234F` (4th char D) → blocked with PAN message; `ABCPE1234F` → passes.
- Several failing rules → all messages shown at once.
