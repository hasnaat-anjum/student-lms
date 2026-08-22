# Student LMS for Coaching Institute

Student LMS is a responsive, bilingual education-management portal designed for the operational rhythm of a coaching institute. It provides distinct administrator, teacher, and student workspaces, with fixed PKR fee rules, attendance, study content, assessment, fee documents, reports, and visible payment-status workflows.

> The checked-in application runs as an interactive demonstration with seeded accounts and integration contracts. It does not process real payments, upload to a live Cloudinary account, or send WhatsApp/email until the institute provides and configures its merchant and delivery credentials.

## Included experience

| Area | Implemented workflow |
| --- | --- |
| Access | Role-specific demo login for administrator, teacher, and student, with a JWT returned by the server-side login contract. |
| Admin | Learner and faculty registers, courses, fee visibility, attendance, reports, and announcements. |
| Teacher | Student list, course materials, attendance marking, assignment review, marks entry, and class-level reporting. |
| Student | Course content, assignment submission, quiz completion, marks, attendance, announcements, fee statement, fee challan, and receipt printing. |
| Finance | Admission fee of **5,000 PKR**, monthly tuition of **3,000 PKR per subject**, semester exam fee of **1,000 PKR**, and late fee of **200 PKR** after the due date. |
| Exports | Browser-printable PDF-style challans, receipts, reports, and Excel-compatible CSV exports. |
| Language | In-context English and Urdu switching, including right-to-left layout support. |

## Demonstration accounts

| Portal | Identity | Password |
| --- | --- | --- |
| Administrator | `admin` | `admin123` |
| Teacher | `teacher@academy.pk` | `teacher123` |
| Student | `SCI-2026-041` | `student123` |

The exact administrator login is intentionally fixed as **`admin / admin123`** for the requested demonstration environment. It must be changed before a public production release.

## Technology profile

The project uses React, TypeScript, Tailwind CSS, Express, tRPC, Drizzle, and the managed database supplied by the project scaffold. This gives the deployed demonstration a working Node/Express service and persistent-database pathway. The requested MongoDB profile is documented in `CONFIGURATION.md` as `MONGODB_URI`; connecting a customer-owned MongoDB cluster requires its URI and a corresponding repository layer before production data is migrated.

## Local setup

Install Node.js 22 or newer and pnpm, then use the following commands:

```bash
git clone <your-github-repository-url>
cd student-lms
pnpm install
pnpm dev
```

Open the local URL printed by the development server. Run quality checks with:

```bash
pnpm test
pnpm check
```

## Production configuration

Add the variables in `CONFIGURATION.md` to a secret manager or host-specific environment-variable panel; never commit production credentials. The project separates integration readiness from actual merchant/payment processing. Its `server/integrations.ts` module creates provider-neutral payment references, tracks the lifecycle `initiated → pending_verification → paid/failed/cancelled`, creates Cloudinary signed-upload signatures, and exposes a deterministic list of fee records that need a reminder.

| Integration | Required configuration | Production responsibility |
| --- | --- | --- |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Request a server-created upload signature and upload PDFs/videos directly to the institute’s Cloudinary account. |
| JazzCash | `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`, `JAZZCASH_RETURN_URL` | Build the merchant request against the institute’s merchant-account specification, redirect the payer, then verify the callback server-side before setting an invoice to paid. |
| Easypaisa | `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `EASYPAISA_RETURN_URL` | Build and validate transactions according to the institute’s issued merchant documentation, never from client-side values. |
| Bank transfer | Bank name, account title, and account number variables | Display instructions, record a pending transfer, and allow an authorized finance user to verify it. |
| Email/WhatsApp reminders | Sender or access-token variables in `CONFIGURATION.md` | Send only to verified parent/student contacts, log delivery status, and honor consent preferences. |

## Fee reminder scheduling

The project includes deterministic fee-reminder candidate selection but does not activate a live recurring job in the demonstration. After the site has been published, configure one daily server-side job that selects invoices with a due date at or before the job date and a non-paid state. Store reminder delivery attempts so that retries are idempotent and a student does not receive duplicate due-date reminders. Use the host’s managed scheduled-job facility rather than an in-process timer.

## Deployment readiness

The supplied project is ready for the managed deployment workflow. Create a checkpoint, then use the project interface’s **Publish** control to make the live version available. For a Vercel or Render migration, use the existing `pnpm build` and `pnpm start` scripts, add the production environment variables in the selected host’s dashboard, configure provider callback URLs to the public domain, and verify database connectivity before accepting live payments.

> Payment providers and Cloudinary must remain unconfigured until the institute supplies its own merchant/asset credentials. The visual demo intentionally reports payment initiation and does not represent a real financial settlement.
