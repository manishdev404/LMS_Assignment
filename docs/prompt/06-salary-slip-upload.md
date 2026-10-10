# 06 — Borrower Step 3: Salary Slip Upload

## Prompt

Let an eligible borrower upload a salary slip (PDF / JPG / PNG, max 5 MB). Store it in MongoDB
GridFS and link it to the borrower's application. Re-uploading replaces the previous file.

## Rules

- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`; allowed extensions
  `.pdf .jpg .jpeg .png`.
- Max size 5 MB (5 × 1024 × 1024 bytes). One file per request, form field name `salarySlip`.
- Don't trust the client's MIME type alone — verify the **magic bytes**:
  PDF `%PDF`, PNG `89 50 4E 47`, JPEG `FF D8 FF`.
- Only allowed after the borrower has an eligible profile (BRE passed) → else `409 PROFILE_INCOMPLETE`.
- Not allowed while an active loan exists (the loan holds a snapshot of the slip) → `409`.

## Storage design

- Multer `memoryStorage` with `limits.fileSize` → buffer → GridFS bucket `salarySlips`
  (`metadata: { userId, originalName }`). Works on Atlas and on stateless hosts (no local disk).
- Profile stores `salarySlip: { fileId, originalName, mimeType, size, uploadedAt }`.
- On replace: update the profile first, then delete the old GridFS file (best effort).
- When the loan is applied, the slip metadata is **snapshotted onto the loan**, so the loan keeps
  pointing at the exact document that was reviewed.

## Endpoints

| Method | Path                                       | Role                | Notes |
| ------ | ------------------------------------------ | ------------------- | ----- |
| POST   | `/api/borrower/salary-slip`                | BORROWER            | multipart → 201 `{ salarySlip }` |
| GET    | `/api/borrower/salary-slip`                | BORROWER            | streams own file |
| GET    | `/api/sanction/loans/:loanId/salary-slip`  | SANCTION, ADMIN     | streams the loan's slip for review |

Download responses set `Content-Type`, `Content-Length` and
`Content-Disposition: inline; filename="<original>"`.

## Errors

| Case | Status / code |
| ---- | ------------- |
| No file | 400 `FILE_REQUIRED` |
| Too large | 413 `FILE_TOO_LARGE` |
| Wrong type / bad magic bytes | 415 `UNSUPPORTED_FILE_TYPE` |

## Frontend

Drag-and-drop zone + file picker, client-side type/size check before upload, upload progress bar
(XHR), preview of the uploaded file name/size with "Replace" and "View" actions.
