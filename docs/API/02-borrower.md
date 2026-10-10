# Borrower API

Access: **BORROWER** (borrower session). All data is scoped to the signed-in borrower.

## GET `/borrower/application`
Current state of the application wizard.

**200**
```json
{
  "profile": { "fullName", "pan", "dateOfBirth", "monthlySalary", "employmentMode",
               "bre": { "eligible", "age", "failures": [], "evaluatedAt" }, "salarySlip": null },
  "activeLoan": null,
  "nextStep": "PERSONAL_DETAILS | SALARY_SLIP | LOAN_CONFIG | TRACK_LOAN",
  "config": { "loan": { "minPrincipal", "maxPrincipal", "principalStep", "minTenureDays", "maxTenureDays", "interestRatePa" },
              "eligibility": { "minAge", "maxAge", "minMonthlySalary", "panPattern" },
              "upload": { "maxSizeBytes", "allowedMimeTypes" } }
}
```

## PUT `/borrower/profile`
Step 2: saves personal details and runs the BRE on the server.

```json
{ "fullName": "Riya Sharma", "pan": "ABCPE1234F", "dateOfBirth": "1996-04-12",
  "monthlySalary": 65000, "employmentMode": "SALARIED" }
```
`employmentMode`: `SALARIED | SELF_EMPLOYED | UNEMPLOYED`

**200** `{ profile }`
**422** `BRE_REJECTED`. Details are still saved for sales follow-up.
```json
{ "details": { "age": 21, "failures": [{ "rule": "AGE", "message": "Applicant age is 21 years; it must be between 23 and 50." }] } }
```
BRE rules: age 23–50 · salary ≥ ₹25,000 · PAN `^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$` · not `UNEMPLOYED`.
**400** malformed input · **409** `ACTIVE_LOAN_EXISTS`, `PAN_IN_USE`

## POST `/borrower/salary-slip`
Step 3: `multipart/form-data`, field **`salarySlip`**, PDF/JPG/PNG, max 5 MB. Replaces any earlier slip.

**201** `{ salarySlip: { originalName, mimeType, size, uploadedAt } }`
**400** `FILE_REQUIRED` · **409** `PROFILE_INCOMPLETE` (BRE not passed) · **413** `FILE_TOO_LARGE` ·
**415** `UNSUPPORTED_FILE_TYPE` (checked by extension, MIME type and file signature)

## GET `/borrower/salary-slip`
Streams the borrower's own slip inline. **200** file · **404**

## POST `/borrower/loans`
Step 4: creates the loan with status **APPLIED**. Interest is calculated on the server.

```json
{ "principal": 100000, "tenureDays": 90 }
```
`principal` 50,000–5,00,000 (whole rupees) · `tenureDays` 30–365.
SI = P × 12 × T / (365 × 100) → `simpleInterest: 2958.9`, `totalRepayment: 102958.9`

**201** `{ loan }` · **400** out of range · **409** `PROFILE_INCOMPLETE`, `ACTIVE_LOAN_EXISTS` ·
**422** `BRE_REJECTED` (re-checked at apply time)

## GET `/borrower/loans`
**200** `{ items: Loan[] }`, newest first.

## GET `/borrower/loans/:loanId`
**200** `{ loan, payments: [{ id, utr, amount, paymentDate, createdAt }] }` · **404** not found or not yours

### Loan object (shared by all modules)
```json
{ "id", "loanNumber": "LN000001", "status": "APPLIED",
  "applicant": { "fullName", "email", "pan", "dateOfBirth", "age", "monthlySalary", "employmentMode" },
  "salarySlip": { "originalName", "mimeType", "size", "uploadedAt" },
  "principal", "tenureDays", "interestRatePa", "simpleInterest", "totalRepayment",
  "amountPaid", "outstanding", "rejectionReason",
  "sanctionedAt", "sanctionedBy", "rejectedAt", "rejectedBy", "disbursedAt", "disbursedBy", "closedAt",
  "statusHistory": [{ "status", "at", "by": { "id", "name", "role" }, "note" }], "createdAt", "updatedAt" }
```
