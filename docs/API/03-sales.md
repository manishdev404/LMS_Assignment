# Sales API

Access: **SALES, ADMIN** (staff session).

## GET `/sales/leads`
Registered borrowers who have **not applied** for a loan yet.

Query: `page`, `limit`, `search` (name, email, PAN), `stage`

| `stage` | Meaning |
| ------- | ------- |
| `REGISTERED` | account only |
| `BRE_REJECTED` | details submitted, eligibility failed |
| `DETAILS_SUBMITTED` | eligible, salary slip missing |
| `DOCUMENT_UPLOADED` | ready to apply |

**200**
```json
{
  "items": [{ "userId", "name", "email", "registeredAt", "stage",
              "profile": { "fullName", "pan", "monthlySalary", "employmentMode", "age",
                           "eligible", "breFailures": [], "salarySlipUploaded", "updatedAt" } }],
  "pagination": { "page", "limit", "total", "totalPages" },
  "stageCounts": { "REGISTERED": 1, "BRE_REJECTED": 1, "DETAILS_SUBMITTED": 0, "DOCUMENT_UPLOADED": 1 }
}
```
`profile` is `null` for `REGISTERED`. **400** invalid `stage`
