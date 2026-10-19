# Email Campaign Management System — Implementation Plan

A production-ready, enterprise-grade Email Campaign Management System built with React 19 + Vite + TypeScript (frontend) and Node.js + Express + Prisma + MySQL (backend).

---

## User Review Required

> [!IMPORTANT]
> **MySQL Database**: This plan assumes you have MySQL installed and running locally (e.g., via XAMPP which you appear to have). Please confirm the MySQL host, port, and credentials you'd like to use.

> [!IMPORTANT]
> **Project Location**: The project will be created at `d:\GIT HUB CLONE\Atreal-cso\` with `frontend/` and `backend/` subdirectories. Confirm this is correct.

> [!WARNING]
> **Token Limit Reality**: This is an extremely large project (~200+ files). I will generate it in sequential phases. Each phase will be a self-contained, buildable increment. The full project will take multiple rounds of generation.

## Open Questions

1. **MySQL Credentials** — What database name, username, and password should be used? (Default: `emailcampaign_db` / `root` / empty)
2. **SMTP for Testing** — Do you have a Gmail App Password or Mailtrap account for testing email sends?
3. **Port Preferences** — Frontend on `5173`, Backend on `5000`? Or different ports?

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                   │
│  Vite · TypeScript · Tailwind · shadcn/ui · Framer Motion│
│  React Router · React Hook Form · TanStack Query · Zod  │
├─────────────────────────────────────────────────────────┤
│                     REST API (HTTPS)                     │
├─────────────────────────────────────────────────────────┤
│                   BACKEND (Express.js)                   │
│  TypeScript · Prisma · JWT · Nodemailer · Multer        │
│  Helmet · CORS · Rate Limiter · Morgan · bcrypt         │
├─────────────────────────────────────────────────────────┤
│                    DATABASE (MySQL)                       │
│  Prisma ORM · Migrations · Indexes · Relations          │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Atreal-cso/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # Prisma singleton
│   │   │   ├── env.ts               # Environment validation
│   │   │   ├── cors.ts              # CORS config
│   │   │   └── multer.ts            # File upload config
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── smtp.controller.ts
│   │   │   ├── contact.controller.ts
│   │   │   ├── template.controller.ts
│   │   │   ├── campaign.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   └── settings.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── smtp.service.ts
│   │   │   ├── contact.service.ts
│   │   │   ├── template.service.ts
│   │   │   ├── campaign.service.ts
│   │   │   ├── email.service.ts      # Nodemailer engine
│   │   │   ├── report.service.ts
│   │   │   ├── encryption.service.ts  # AES-256
│   │   │   └── queue.service.ts       # Email queue
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   ├── smtp.repository.ts
│   │   │   ├── contact.repository.ts
│   │   │   ├── template.repository.ts
│   │   │   ├── campaign.repository.ts
│   │   │   └── report.repository.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── role.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   ├── upload.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── smtp.routes.ts
│   │   │   ├── contact.routes.ts
│   │   │   ├── template.routes.ts
│   │   │   ├── campaign.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   └── settings.routes.ts
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   ├── smtp.validator.ts
│   │   │   ├── contact.validator.ts
│   │   │   ├── template.validator.ts
│   │   │   └── campaign.validator.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── smtp.types.ts
│   │   │   ├── contact.types.ts
│   │   │   └── campaign.types.ts
│   │   ├── utils/
│   │   │   ├── helpers.ts
│   │   │   ├── constants.ts
│   │   │   ├── logger.ts
│   │   │   ├── pagination.ts
│   │   │   └── excel.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── uploads/
│   │   ├── attachments/
│   │   ├── imports/
│   │   └── templates/
│   ├── .env.example
│   ├── tsconfig.json
│   ├── package.json
│   └── nodemon.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   └── AuthLayout.tsx
│   │   │   ├── common/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── SkeletonLoader.tsx
│   │   │   │   ├── SearchFilter.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── FileUploader.tsx
│   │   │   │   └── StatusBadge.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   ├── CampaignChart.tsx
│   │   │   │   ├── RecentActivity.tsx
│   │   │   │   └── SmtpUsageChart.tsx
│   │   │   ├── smtp/
│   │   │   │   ├── SmtpForm.tsx
│   │   │   │   ├── SmtpCard.tsx
│   │   │   │   └── SmtpTestDialog.tsx
│   │   │   ├── contacts/
│   │   │   │   ├── ContactForm.tsx
│   │   │   │   ├── ImportDialog.tsx
│   │   │   │   └── ContactTable.tsx
│   │   │   ├── templates/
│   │   │   │   ├── TemplateForm.tsx
│   │   │   │   ├── TemplatePreview.tsx
│   │   │   │   └── RichTextEditor.tsx
│   │   │   ├── campaigns/
│   │   │   │   ├── CampaignForm.tsx
│   │   │   │   ├── CampaignProgress.tsx
│   │   │   │   ├── CampaignCard.tsx
│   │   │   │   └── RecipientTable.tsx
│   │   │   └── reports/
│   │   │       ├── ReportChart.tsx
│   │   │       └── ExportButton.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   └── ResetPasswordPage.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── smtp/
│   │   │   │   └── SmtpPage.tsx
│   │   │   ├── contacts/
│   │   │   │   └── ContactsPage.tsx
│   │   │   ├── templates/
│   │   │   │   └── TemplatesPage.tsx
│   │   │   ├── campaigns/
│   │   │   │   ├── CampaignsPage.tsx
│   │   │   │   └── CampaignDetailPage.tsx
│   │   │   ├── reports/
│   │   │   │   └── ReportsPage.tsx
│   │   │   ├── settings/
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── ChangePasswordPage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSmtp.ts
│   │   │   ├── useContacts.ts
│   │   │   ├── useTemplates.ts
│   │   │   ├── useCampaigns.ts
│   │   │   ├── useReports.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useDebounce.ts
│   │   ├── services/
│   │   │   ├── api.ts                 # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── smtp.service.ts
│   │   │   ├── contact.service.ts
│   │   │   ├── template.service.ts
│   │   │   ├── campaign.service.ts
│   │   │   └── report.service.ts
│   │   ├── store/
│   │   │   └── authStore.ts           # Zustand or Context
│   │   ├── lib/
│   │   │   ├── utils.ts               # shadcn/ui utils
│   │   │   └── validators.ts          # Zod schemas
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── components.json                # shadcn/ui config
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── docs/
│   ├── API.md
│   ├── INSTALLATION.md
│   └── DEPLOYMENT.md
├── .env.example
└── README.md
```

---

## Proposed Changes

### Phase 1 — Backend Foundation & Database

#### [NEW] [schema.prisma](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/prisma/schema.prisma)

Complete Prisma schema with all 10 tables:

| Table | Key Fields | Relations |
|---|---|---|
| **User** | id, name, email, password, role (ADMIN/USER), avatar, isActive, refreshToken | → SMTPs, Contacts, Templates, Campaigns, ActivityLogs |
| **SmtpAccount** | id, name, host, port, username, encryptedPassword, encryption (SSL/TLS/NONE), fromEmail, fromName, provider (GMAIL/OUTLOOK/ZOHO/OFFICE365/CUSTOM), isDefault, isEnabled | → User, Campaigns |
| **Contact** | id, email, firstName, lastName, company, phone, tags, group, status, isSubscribed | → User, CampaignRecipients |
| **Template** | id, name, subject, htmlContent, textContent, type (HTML/PLAIN), variables | → User, Campaigns |
| **Campaign** | id, name, subject, status (DRAFT/SCHEDULED/RUNNING/PAUSED/COMPLETED/CANCELLED/FAILED), scheduledAt, startedAt, completedAt, totalRecipients, sent, failed, batchSize, delayMs | → User, SMTP, Template, Recipients, Attachments |
| **CampaignRecipient** | id, status (PENDING/SENT/FAILED/BOUNCED), sentAt, error, retryCount | → Campaign, Contact |
| **Attachment** | id, filename, originalName, mimeType, size, path | → Campaign |
| **ActivityLog** | id, action, entity, entityId, details, ipAddress | → User |
| **Setting** | id, key, value, type | Global settings |
| **Notification** | id, title, message, type, isRead | → User |

All tables include `createdAt`, `updatedAt`. Strategic `@@index` on foreign keys, email fields, and status columns.

---

#### [NEW] Backend Core Files

| File | Purpose |
|---|---|
| `backend/package.json` | All dependencies: express, prisma, bcryptjs, jsonwebtoken, nodemailer, multer, xlsx, helmet, cors, morgan, express-rate-limit, dotenv, zod, crypto-js |
| `backend/tsconfig.json` | Strict TypeScript config with path aliases |
| `backend/.env.example` | All environment variables documented |
| `backend/src/server.ts` | Server entry point with graceful shutdown |
| `backend/src/app.ts` | Express app with all middleware wired |
| `backend/src/config/database.ts` | Prisma singleton client |
| `backend/src/config/env.ts` | Zod-validated environment variables |

---

#### [NEW] Authentication System

| File | Features |
|---|---|
| `auth.controller.ts` | Register, Login, Logout, RefreshToken, ForgotPassword, ResetPassword, ChangePassword |
| `auth.service.ts` | Password hashing (bcrypt, 12 rounds), JWT sign/verify (access + refresh), token rotation |
| `auth.middleware.ts` | Bearer token extraction, verification, user injection into `req.user` |
| `role.middleware.ts` | Role-based guard: `requireRole('ADMIN')` |
| `auth.validator.ts` | Zod schemas for all auth inputs |

**JWT Strategy**: Access token (15min) + Refresh token (7 days) stored in httpOnly cookie. Token rotation on refresh.

---

#### [NEW] SMTP Management

| File | Features |
|---|---|
| `smtp.controller.ts` | CRUD, test connection, toggle enable/disable, set default |
| `smtp.service.ts` | Provider presets (Gmail, Outlook, Zoho, Office365), connection testing via Nodemailer verify() |
| `encryption.service.ts` | AES-256-GCM encryption/decryption for SMTP passwords using `crypto` module |

---

#### [NEW] Contact Management

| File | Features |
|---|---|
| `contact.controller.ts` | CRUD, bulk delete, import (Excel/CSV), search, filter, paginate |
| `contact.service.ts` | Duplicate detection, email validation (regex + Zod), tag/group management |
| `excel.ts` | xlsx parsing for imports, export generation |

---

#### [NEW] Template Management

| File | Features |
|---|---|
| `template.controller.ts` | CRUD, preview with variable substitution |
| `template.service.ts` | Variable extraction (regex), HTML sanitization, personalization engine |

---

#### [NEW] Campaign & Email Engine

| File | Features |
|---|---|
| `campaign.controller.ts` | Create, start, pause, resume, cancel, retry failed, schedule |
| `campaign.service.ts` | Campaign lifecycle management, recipient assignment |
| `email.service.ts` | Nodemailer with connection pooling, retry logic (3 attempts with exponential backoff), configurable batch size & delay, attachment handling |
| `queue.service.ts` | In-memory queue with concurrency control, rate limiting, progress tracking |

**Email Sending Flow**:
1. Campaign starts → recipients loaded → queued in batches
2. Each batch: create Nodemailer transport → send with delay between emails → log result
3. Failed emails: retry up to 3 times with exponential backoff
4. Real-time progress: `sent/total` ratio updated per email
5. SMTP rotation: round-robin across enabled SMTP accounts

---

#### [NEW] Reports & Analytics

| File | Features |
|---|---|
| `report.controller.ts` | Dashboard stats, campaign history, daily/monthly reports |
| `report.service.ts` | Aggregation queries, Excel/PDF export |

---

#### [NEW] Middleware & Security

| File | Purpose |
|---|---|
| `errorHandler.middleware.ts` | Centralized error handling with custom AppError class |
| `validate.middleware.ts` | Zod schema validation for request body/params/query |
| `rateLimiter.middleware.ts` | express-rate-limit: 100 req/15min general, 5 req/15min for auth |
| `upload.middleware.ts` | Multer config: file type validation, size limits (10MB), organized storage |

---

### Phase 2 — Frontend Application

#### [NEW] Frontend Scaffolding

| File | Purpose |
|---|---|
| `frontend/package.json` | React 19, Vite, TypeScript, Tailwind, shadcn/ui, Framer Motion, React Router, React Hook Form, TanStack Query, Zod, Axios, Zustand, Recharts, Lucide |
| `frontend/vite.config.ts` | Tailwind plugin, path aliases |
| `frontend/src/index.css` | Complete design system: CSS variables for dark/light mode, glassmorphism, gradients, animations |
| `frontend/components.json` | shadcn/ui configuration |

---

#### [NEW] Design System & Theme

**Color Palette** (Dark mode primary):
- Background: `hsl(222, 47%, 6%)` → Deep navy
- Card: `hsl(222, 47%, 9%)` with glass effect (`backdrop-blur`)
- Primary: `hsl(217, 91%, 60%)` → Vibrant blue
- Accent: `hsl(262, 83%, 58%)` → Purple accent
- Success/Warning/Error: Curated HSL values

**Typography**: Inter font family (Google Fonts)

**Animations**: Framer Motion for page transitions, card hover effects, skeleton loading, progress bars

---

#### [NEW] Layout Components

| Component | Features |
|---|---|
| `DashboardLayout.tsx` | Collapsible sidebar + header + main area, responsive |
| `Sidebar.tsx` | Navigation with icons, active state, collapse animation, role-based menu items |
| `Header.tsx` | Search bar, notifications bell, user avatar dropdown, theme toggle |
| `AuthLayout.tsx` | Centered card with gradient background, animated logo |

---

#### [NEW] Auth Pages

| Page | Features |
|---|---|
| `LoginPage.tsx` | Email/password form, "Remember me", social layout, validation, loading state |
| `RegisterPage.tsx` | Name/email/password/confirm form, password strength indicator |
| `ForgotPasswordPage.tsx` | Email input, success message |
| `ResetPasswordPage.tsx` | New password form with token validation |

---

#### [NEW] Dashboard Page

| Component | Features |
|---|---|
| `DashboardPage.tsx` | 4 stat cards (contacts, campaigns, sent, success rate), campaign chart, recent activity, SMTP usage |
| `StatsCard.tsx` | Animated counter, icon, trend indicator, glassmorphism |
| `CampaignChart.tsx` | Recharts area chart: sent vs failed over time |
| `RecentActivity.tsx` | Timeline component with icons and relative timestamps |

---

#### [NEW] SMTP Pages

| Component | Features |
|---|---|
| `SmtpPage.tsx` | Grid of SMTP cards + add button |
| `SmtpForm.tsx` | Provider selector with auto-fill (Gmail → smtp.gmail.com:587), form validation |
| `SmtpCard.tsx` | Card with provider icon, status badge, actions dropdown |
| `SmtpTestDialog.tsx` | Test email dialog with live connection status |

---

#### [NEW] Contacts Pages

| Component | Features |
|---|---|
| `ContactsPage.tsx` | DataTable with search, filters (group, tag, status), bulk actions |
| `ContactForm.tsx` | Sheet/dialog form for add/edit |
| `ImportDialog.tsx` | Drag-and-drop file upload, preview imported data, column mapping |

---

#### [NEW] Templates Pages

| Component | Features |
|---|---|
| `TemplatesPage.tsx` | Grid view of template cards |
| `TemplateForm.tsx` | Rich text editor (TipTap/Quill), HTML/Plain toggle, variable insertion toolbar |
| `TemplatePreview.tsx` | Live preview with sample data |

---

#### [NEW] Campaigns Pages

| Component | Features |
|---|---|
| `CampaignsPage.tsx` | Table with status filters, bulk actions |
| `CampaignForm.tsx` | Multi-step form: Details → Template → Recipients → Schedule → Review |
| `CampaignDetailPage.tsx` | Live progress bar, recipient table, retry failed, pause/resume |
| `CampaignProgress.tsx` | Real-time progress ring + stats |

---

#### [NEW] Reports Pages

| Component | Features |
|---|---|
| `ReportsPage.tsx` | Date range picker, charts, export buttons |
| `ReportChart.tsx` | Recharts: bar chart for daily, line chart for monthly |
| `ExportButton.tsx` | Download Excel/PDF reports |

---

#### [NEW] Reusable Components

| Component | Features |
|---|---|
| `DataTable.tsx` | Sortable, searchable table with pagination, row selection, responsive |
| `ConfirmDialog.tsx` | AlertDialog with customizable title, description, action |
| `EmptyState.tsx` | Illustration + message + CTA button |
| `SkeletonLoader.tsx` | Shimmer animation matching each page layout |
| `FileUploader.tsx` | Drag-and-drop with progress bar, file type validation |
| `StatusBadge.tsx` | Color-coded badges for campaign/recipient status |

---

### Phase 3 — Documentation & Deployment

#### [NEW] Documentation

| File | Contents |
|---|---|
| `README.md` | Project overview, features, screenshots, quick start |
| `docs/API.md` | Complete REST API documentation with endpoints, request/response examples |
| `docs/INSTALLATION.md` | Step-by-step setup guide |
| `docs/DEPLOYMENT.md` | Production deployment guide (PM2, Nginx, SSL) |
| `.env.example` | All environment variables with descriptions |

---

## Execution Phases

| Phase | Scope | Estimated Files |
|---|---|---|
| **1A** | Backend: Config, Prisma schema, Auth system | ~20 files |
| **1B** | Backend: SMTP, Contacts, Templates services | ~20 files |
| **1C** | Backend: Campaigns, Email engine, Reports, Queue | ~15 files |
| **2A** | Frontend: Scaffolding, Design system, Layout, Auth pages | ~25 files |
| **2B** | Frontend: Dashboard, SMTP, Contacts pages | ~20 files |
| **2C** | Frontend: Templates, Campaigns, Reports pages | ~20 files |
| **2D** | Frontend: Reusable components, Settings, Polish | ~15 files |
| **3** | Documentation, .env, README, Guides | ~5 files |

**Total: ~140+ production files**

---

## Verification Plan

### Automated Tests
```bash
# Backend
cd backend && npm run build          # TypeScript compilation check
npx prisma validate                   # Schema validation
npx prisma migrate dev --name init   # Migration test

# Frontend
cd frontend && npm run build         # Vite build check
npx tsc --noEmit                     # TypeScript check
```

### Manual Verification
1. Start MySQL → run migrations → seed database
2. Start backend (`npm run dev`) → test auth endpoints with Postman/curl
3. Start frontend (`npm run dev`) → verify all pages render
4. Test full flow: Register → Login → Add SMTP → Import Contacts → Create Template → Launch Campaign
5. Verify dark/light mode toggle
6. Verify responsive layout on mobile viewport
