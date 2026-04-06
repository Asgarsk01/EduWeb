# EduWeb

EduWeb is a role-based admissions CRM designed for higher-education teams. The UI is branded as **EduMerge**, while the codebase is organized as a React + TypeScript + Vite application backed by **Supabase** and optional **Gemini-powered** AI summaries.

The project is built around three working roles:

- `ADMIN` for institutional setup and governance
- `OFFICER` for applicant intake and admission processing
- `MANAGEMENT` for monitoring, trends, and executive oversight

## What The Project Covers

At a high level, the application combines:

- role-aware routing and navigation
- dashboard analytics for management and officers
- applicant intake, document verification, fee tracking, and admission confirmation
- admin-facing master data and rulebook management
- global search, notifications, and AI-generated summaries
- a desktop-only workspace experience

## Roles And Modules

### Admin

The admin experience is focused on configuration and system control.

- **Institution & Campus**
  Maintains institution records, campus records, basic identity metadata, and top-level setup counts.
- **Department & Program**
  Manages departments, academic programs, and campus-program mapping.
- **Academic Year**
  Creates academic years and activates the current cycle.
- **Seat Matrix**
  Maintains quota distribution and intake limits per program, with client-side validation before saving.
- **Document Master**
  Controls the admission document checklist, mandatory flags, applicability, and active/archive state.
- **User Management**
  Lists user profiles, updates status, removes users, and provisions new users through a Supabase Edge Function.

Primary files:

- [`src/pages/admin/Institution.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\admin\Institution.tsx)
- [`src/pages/admin/Department.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\admin\Department.tsx)
- [`src/pages/admin/AcademicYear.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\admin\AcademicYear.tsx)
- [`src/pages/admin/SeatMatrix.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\admin\SeatMatrix.tsx)
- [`src/pages/admin/DocumentMaster.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\admin\DocumentMaster.tsx)
- [`src/pages/admin/UserManagement.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\admin\UserManagement.tsx)

### Admission Officer

The officer role is the operational core of the product.

- **Dashboard**
  Shows intake KPIs, program progress, quota distribution, and an AI summary preview.
- **Applicants**
  Lists applicants, filters the queue, supports quick intake, profile viewing, cancellation, and admission processing.
- **Applicant Detail**
  A 4-step workflow for seat lock, document verification, fee confirmation, and final admission confirmation.
- **Problem Areas**
  Converts bottlenecks into actionable items such as reminders and seat withdrawal.
- **Insights**
  Combines live admission velocity, AI alerts, and trend widgets for day-to-day tracking.

Primary files:

- [`src/pages/Dashboard.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\Dashboard.tsx)
- [`src/pages/officer/Applicants.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\officer\Applicants.tsx)
- [`src/pages/officer/ApplicantDetail.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\officer\ApplicantDetail.tsx)
- [`src/pages/officer/ProblemAreas.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\officer\ProblemAreas.tsx)
- [`src/pages/officer/Insights.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\officer\Insights.tsx)

### Management

The management role is read-heavy and analytics-first.

- **Dashboard**
  Reuses the main dashboard shell for executive KPIs, program progress, quota distribution, and AI briefing preview.
- **Problem Areas**
  Surfaces overdue fees and process bottlenecks in a simpler review-oriented format.
- **Insights**
  Shows admission velocity, capacity prediction, and a longer AI-generated narrative briefing.

Primary files:

- [`src/pages/Dashboard.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\Dashboard.tsx)
- [`src/pages/ProblemAreas.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\ProblemAreas.tsx)
- [`src/pages/Insights.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\Insights.tsx)

## Shared Modules

- **Routing and role checks**
  [`src/routes/index.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\routes\index.tsx), [`src/lib/session.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\lib\session.ts)
- **Global layout**
  [`src/components/Header.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\components\Header.tsx), [`src/components/Sidebar.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\components\Sidebar.tsx)
- **Desktop-only guard**
  [`src/components/DesktopRestriction.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\components\DesktopRestriction.tsx)
- **Authentication screens**
  [`src/pages/Login.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\Login.tsx), [`src/pages/ForgotPassword.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\ForgotPassword.tsx)
- **Legal**
  [`src/pages/PrivacyPolicy.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\PrivacyPolicy.tsx)

## Service Layer

The frontend is split cleanly between UI modules and data-access modules.

| Service | Purpose | Used Most By |
| --- | --- | --- |
| `authService` | Supabase sign-in, current user lookup, profile updates, provisioning | Admin, Login, Header |
| `analyticsService` | Dashboard KPIs, program progress, quota data, admission velocity | Officer, Management |
| `applicantService` | Applicant CRUD, fee updates, document status, final confirmation RPC | Officer |
| `masterService` | Institutions, campuses, departments, programs, admin summary | Admin |
| `rulebookService` | Academic years, document masters, seat matrices | Admin, Officer |
| `problemService` | Bottleneck views and officer action logging | Officer, Management |
| `notificationService` | Notification feed, realtime subscription, mark-as-read actions | Shared Header |
| `searchService` | Role-aware global search RPC | Shared Header |
| `aiService` | Gemini-based management briefings, officer alerts, dashboard summaries | Officer, Management |

Relevant files:

- [`src/services/authService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\authService.ts)
- [`src/services/analyticsService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\analyticsService.ts)
- [`src/services/applicantService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\applicantService.ts)
- [`src/services/masterService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\masterService.ts)
- [`src/services/rulebookService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\rulebookService.ts)
- [`src/services/problemService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\problemService.ts)
- [`src/services/notificationService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\notificationService.ts)
- [`src/services/searchService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\searchService.ts)
- [`src/services/aiService.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services\aiService.ts)

## Data Model Snapshot

The generated database typings show the application is centered around these tables and views:

- master data: institutions, campuses, departments, programs
- rulebook data: academic years, document masters, seat matrices
- admissions data: applicants, applicant documents, applicant fees
- audit data: audit logs
- user data: user profiles
- reporting views: funnel metrics, management KPIs, program progress, quota distribution, problem areas

Primary type files:

- [`src/types/database.types.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\types\database.types.ts)
- [`src/types/auth.types.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\types\auth.types.ts)
- [`src/types/applicant.types.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\types\applicant.types.ts)
- [`src/types/analytics.types.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\types\analytics.types.ts)
- [`src/types/master.types.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\types\master.types.ts)
- [`src/types/problem.types.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\types\problem.types.ts)
- [`src/types/rulebook.types.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\types\rulebook.types.ts)

## UI And Frontend Notes

- Tailwind CSS v4 is used with custom theme tokens defined in [`src/index.css`](C:\Users\front\OneDrive\Desktop\EduWeb\src\index.css).
- Motion and animated transitions are implemented through the `motion/react` package.
- Shared fonts and Material Symbols are loaded from [`index.html`](C:\Users\front\OneDrive\Desktop\EduWeb\index.html).
- The app intentionally blocks mobile and tablet usage through [`src/components/DesktopRestriction.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\components\DesktopRestriction.tsx).

## Current Implementation Notes

This repository already has solid structure and a meaningful Supabase-backed workflow, but a few parts are lighter than the rest:

- the forgot-password screen is currently a request UI, not a connected reset workflow
- some interactions are present as placeholders, such as quota-cell click alerts on the dashboard
- officer insights mix live data with a few static presentation blocks
- the app depends on Supabase database views, RPCs, and an Edge Function that are not defined inside this frontend repo

## Project Structure

```text
src/
  components/    Shared layout and utility UI
  hooks/         Reusable hooks
  lib/           Session helpers and Supabase client
  pages/         Role pages and shared screens
  routes/        Application routes
  services/      Supabase and AI access layer
  types/         Generated and hand-authored TypeScript types
public/
  Assests/       Brand images and favicon assets
Doc/
  *.md, *.pdf    Project notes and supporting documentation
scripts/
  Utility scripts used outside the UI
```

## Environment Variables

Create a local `.env` file with the values required by your environment:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required for the frontend
- `VITE_GEMINI_API_KEY` enables AI summaries and officer alerts
- `SUPABASE_SERVICE_ROLE_KEY` should only be used for trusted scripts or backend workflows, not exposed to clients

## Local Development

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build
npm run lint
npm run preview
```

## Recommended Reading Order

If you are reviewing the codebase for the first time, this order gives the clearest picture:

1. [`src/routes/index.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\routes\index.tsx)
2. [`src/lib/session.ts`](C:\Users\front\OneDrive\Desktop\EduWeb\src\lib\session.ts)
3. [`src/components/Header.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\components\Header.tsx)
4. [`src/pages/Dashboard.tsx`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages\Dashboard.tsx)
5. the admin, officer, and management pages under [`src/pages`](C:\Users\front\OneDrive\Desktop\EduWeb\src\pages)
6. the service layer under [`src/services`](C:\Users\front\OneDrive\Desktop\EduWeb\src\services)

## Summary

EduWeb already has a good separation between role-based UI, data services, and database types. The strongest parts of the current implementation are the admin master-data modules, the officer applicant workflow, and the shared analytics/search/notification shell around them.
