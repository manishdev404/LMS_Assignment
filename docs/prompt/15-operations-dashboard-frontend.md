# 15 — Frontend: Operations Dashboard (`Operations_Dashboard/`, Next.js 16, port 3001)

## Prompt

Build the internal dashboard with four modules (Sales, Sanction, Disbursement, Collection) plus
an Admin Overview. Each executive sees only their module; admin sees all. RBAC enforced in
`proxy.ts`, in the UI, and (authoritatively) by the API.

## Routes

| Route           | Roles                     |
| --------------- | ------------------------- |
| `/login`        | guest (staff login; optional demo-credential quick-fill when `NEXT_PUBLIC_SHOW_DEMO_LOGINS=true`) |
| `/`             | redirects to the role's home module |
| `/overview`     | ADMIN |
| `/sales`        | ADMIN, SALES |
| `/sanction`     | ADMIN, SANCTION |
| `/disbursement` | ADMIN, DISBURSEMENT |
| `/collection`   | ADMIN, COLLECTION |
| `/forbidden`    | any signed-in user (403 page) |

## Architecture

```
src/
├── app/
│   ├── login/                 # public
│   ├── (dashboard)/           # shared shell: sidebar + topbar, AuthProvider-guarded
│   │   ├── overview/ sales/ sanction/ disbursement/ collection/
│   └── forbidden/
├── components/
│   ├── ui/                    # Button, Field/Input/Select/Textarea, badges, Modal (<dialog>),
│   │                          # DataTable, Pagination, SearchInput, StatCard, Spinner, icons
│   ├── layout/                # DashboardShell (role-filtered sidebar + mobile drawer), ModuleHeader
│   ├── auth/                  # RequireRole, LoginForm
│   └── modules/               # sales / sanction / disbursement / collection / overview modules,
│                              # LoanActionDialog, PaymentDialog, LoanDetail, loan table cells
├── context/                   # auth-context (staff session), toast-context
├── lib/                       # api.ts, rbac.ts (MODULES), format.ts, session.ts, navigation.ts
├── hooks/                     # useApiQuery (keeps previous data while refetching), useDebouncedValue
├── types/api.ts
└── proxy.ts
```

## Behaviour

- `lib/rbac.ts` is the single map of module → path, label, icon, allowed roles; used by proxy,
  sidebar and `RequireRole`.
- Lists: search (debounced), pagination, loading skeleton, empty state, error state with retry.
- Actions: confirm dialogs, optimistic disable, toasts, API error messages surfaced verbatim
  (e.g. "UTR SBIN0001234567 has already been recorded").
- Responsive: sidebar collapses into a top menu on < 1024 px; tables scroll horizontally.
