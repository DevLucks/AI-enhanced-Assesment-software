# EduAssess — Technical Documentation

## Project Overview

EduAssess is a full-stack web application built as a final year project. It implements an AI-assisted academic assessment system using modern web technologies. This document covers the technology stack, system architecture, database design, API structure, AI integration, and the full development history.

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15 | Full-stack React framework (App Router) |
| React | 18 | UI component library |
| TypeScript | 5 | Static typing |
| Tailwind CSS | 4 | Utility-first styling (CSS-first configuration) |
| Lucide React | Latest | Icon library |
| next/font | Built-in | Google Fonts (Plus Jakarta Sans, Inter) |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 15 | REST API endpoints (App Router route handlers) |
| NextAuth | 5 (beta) | Authentication and session management |
| Prisma ORM | 7 | Database access layer |
| bcryptjs | 3 | Password hashing |
| Zod | 4 | Input validation and schema parsing |

### Database

| Technology | Details |
|-----------|---------|
| PostgreSQL | Hosted on Neon (serverless PostgreSQL) |
| Neon | Cloud-managed serverless Postgres with connection pooling |
| Prisma Migrations | Version-controlled schema migrations |

### AI Integration

| Technology | Details |
|-----------|---------|
| Google Gemini | `gemini-2.5-flash-lite` model via `@google/generative-ai` SDK |
| Grading approach | Prompt-based: question + model answer + student answer → JSON score |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Neon PostgreSQL | Production database |
| Vercel (recommended) | Deployment platform for Next.js |
| GitHub | Source control |

---

## System Architecture

EduAssess follows the Next.js App Router architecture with route groups, server components, and client components working together.

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  Client Components (forms, exam UI, grading) │
└────────────────────┬────────────────────────┘
                     │ HTTP / fetch
┌────────────────────▼────────────────────────┐
│              Next.js Server                  │
│                                              │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Server Pages   │  │   API Routes     │  │
│  │ (data fetching) │  │  (mutations)     │  │
│  └────────┬────────┘  └───────┬──────────┘  │
│           │                   │             │
│  ┌────────▼───────────────────▼──────────┐  │
│  │            Prisma ORM                 │  │
│  └────────────────────┬──────────────────┘  │
│                       │                     │
│  ┌────────────────────▼──────────────────┐  │
│  │         Neon PostgreSQL               │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         Google Gemini AI              │  │
│  │     (subjective answer grading)       │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Route Groups

The application uses Next.js route groups to separate concerns:

- `(auth)` — Public auth pages with a centered card layout. No session required.
- `(dashboard)` — Protected pages with the dark navy sidebar layout. Requires valid session.

### Middleware

`middleware.ts` runs on every request (excluding static assets and API routes). It:

1. Redirects unauthenticated users to `/login`
2. Redirects authenticated users away from auth pages to their role dashboard
3. Enforces role-based route access (admin cannot access `/lecturer`, etc.)

---

## Database Design

### Schema Overview

The database uses 10 models across 3 domains: users/auth, academic structure, and assessments.

```
User ──────── Department
  │               │
  │           Course ─────────── Assessment ─── Question ─── Option
  │               │                   │               │
  └─── Courses ───┘           Submission         GradingKeyword
       (many-to-many)              │
                               Answer ─────── (linked to Question)
                                   │
                               Result
```

### Model Reference

#### User
```
id            String   (CUID)
name          String
email         String   (unique)
password      String   (bcrypt hashed)
role          Role     (ADMIN | LECTURER | STUDENT)
matricNumber  String?  (unique, students only)
staffId       String?  (unique, lecturers only)
departmentId  String?
createdAt     DateTime
updatedAt     DateTime
```

#### Department
```
id        String
name      String
code      String  (unique, e.g. "CPE")
createdAt DateTime
```

#### Course
```
id           String
name         String
code         String   (unique, e.g. "CPE301")
departmentId String
→ lecturers  User[]   (many-to-many, "CourseLecturer")
→ students   User[]   (many-to-many, "CourseStudents")
→ assessments Assessment[]
```

#### Assessment
```
id          String
title       String
description String?
duration    Int      (minutes)
totalMarks  Int
startTime   DateTime?
endTime     DateTime?
status      AssessmentStatus  (DRAFT | PUBLISHED | ACTIVE | CLOSED)
courseId    String
lecturerId  String
createdAt   DateTime
updatedAt   DateTime
```

#### Question
```
id          String
text        String
type        QuestionType  (OBJECTIVE | SUBJECTIVE)
marks       Int
order       Int
modelAnswer String?  (used by AI grader for SUBJECTIVE questions)
assessmentId String
```

#### Option
```
id         String
label      String  (A, B, C, D)
text       String
isCorrect  Boolean
questionId String
```

#### GradingKeyword
```
id         String
keyword    String
weight     Float   (0.0–1.0)
questionId String
```

#### Submission
```
id           String
startedAt    DateTime
submittedAt  DateTime?
status       SubmissionStatus  (IN_PROGRESS | SUBMITTED)
studentId    String
assessmentId String
→ unique constraint: [studentId, assessmentId]
```

#### Answer
```
id             String
answerText     String?   (SUBJECTIVE answers)
selectedOption String?   (OBJECTIVE: stores option ID)
marksAwarded   Float?    (set by AI or lecturer)
aiFeedback     String?   (AI-generated feedback text)
aiConfidence   Float?    (0.0–1.0)
gradedAt       DateTime?
submissionId   String
questionId     String
→ unique constraint: [submissionId, questionId]
```

#### Result
```
id              String
totalMarks      Float
objectiveMarks  Float
subjectiveMarks Float
grade           String   (A, B, C, D, F)
submissionId    String   (unique — one result per submission)
createdAt       DateTime
```

---

## API Routes

All API routes use Next.js App Router route handlers (`route.ts` files).

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handler (login, session) |
| POST | `/api/auth/register` | Public registration for students and lecturers |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/users` | List all users (with role filter) or create user |
| GET/PATCH/DELETE | `/api/admin/users/[id]` | Get, update, or delete a specific user |
| GET/POST | `/api/admin/departments` | List or create departments |
| GET/PATCH/DELETE | `/api/admin/departments/[id]` | Update or delete a department |
| GET/POST | `/api/admin/courses` | List or create courses |
| GET/PATCH/DELETE | `/api/admin/courses/[id]` | Update or delete a course |
| GET | `/api/admin/stats` | Aggregate stats for admin dashboard |

### Lecturer
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/lecturer/assessments` | List lecturer's assessments or create new |
| GET/PATCH/DELETE | `/api/lecturer/assessments/[id]` | Manage a specific assessment |
| GET/POST | `/api/lecturer/assessments/[id]/questions` | List or add questions |
| PATCH/DELETE | `/api/lecturer/assessments/[id]/questions/[questionId]` | Edit or delete a question |
| POST | `/api/lecturer/assessments/[id]/publish` | Publish, close, or release results |
| GET/PATCH | `/api/lecturer/results` | View results or override AI grades |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/courses` | List all courses with `enrolled: boolean` for the current student |
| POST | `/api/student/courses/[id]/enroll` | Self-enroll in a course |
| DELETE | `/api/student/courses/[id]/enroll` | Self-unenroll from a course |
| GET | `/api/student/assessments` | List available assessments |
| GET | `/api/student/assessments/[id]` | Get a specific assessment |
| POST | `/api/student/assessments/[id]/start` | Start a submission |
| POST | `/api/student/assessments/[id]/submit` | Submit completed answers |
| GET | `/api/student/results` | List student's results |

### Lecturer (additional)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lecturer/courses` | List only the courses the lecturer is assigned to |

### Grading
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/grading` | Trigger AI grading for a submission |

---

## AI Grading System

### How It Works

When a student submits an assessment, objective (MCQ) answers are graded immediately by comparing the selected option to the `isCorrect` flag in the database. Subjective (essay) answers are sent to Google Gemini for grading.

### Gemini Prompt Structure

For each subjective answer, the following context is assembled and sent to Gemini:

1. **Question text** — what was asked
2. **Model answer** — the ideal response written by the lecturer
3. **Grading keywords** — optional key concepts with weights (0–1) indicating importance
4. **Student answer** — what the student wrote
5. **Maximum marks** — the mark value for the question

The model is instructed to return a JSON object with:
```json
{
  "score": 7.5,
  "confidence": 0.82,
  "feedback": "Good understanding of core concepts but lacks detail on edge cases."
}
```

### Confidence Scoring

The `confidence` value (0.0–1.0) reflects the AI's certainty in its grade:
- **≥ 0.80** — High confidence, shown in green
- **0.50–0.79** — Moderate confidence, shown in amber
- **< 0.50** — Low confidence, shown in red

Lecturers are encouraged to manually review low-confidence grades.

### Security

Model answers are stored in the database and are only read server-side during grading. They are never included in API responses sent to students.

---

## Frontend Architecture

### Design System — Academic Precision

The UI follows a custom design system called "Academic Precision" built in Stitch and implemented using Tailwind CSS v4.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6366F1` (Indigo) | Buttons, active states, focus rings |
| Secondary | `#8B5CF6` (Violet) | Gradients, AI feature highlights |
| Sidebar | `#0F172A` (Navy) | Navigation sidebar background |
| Page BG | `#F8FAFC` (Slate 50) | Application canvas |
| Heading font | Plus Jakarta Sans | All headings and display text |
| Body font | Inter | All body text, labels, tables |
| Border radius | 8px (default), 16px (cards) | Component rounding |

### Component Structure

```
src/components/
├── providers.tsx          — SessionProvider wrapper (client)
├── ui/
│   ├── Button.tsx         — Primary (gradient), secondary, danger, ghost + loading state
│   ├── Input.tsx          — Labelled input with icon, error state, forwardRef
│   ├── Badge.tsx          — Status pills (success/warning/danger/info/neutral/primary) + GradeCircle
│   ├── Card.tsx           — Content card + StatCard (icon, value, label, trend, color)
│   └── Skeleton.tsx       — Skeleton, TableSkeleton, CardGridSkeleton pulse placeholders
└── layout/
    ├── Sidebar.tsx        — Role-aware nav, active border-l-4, sign-out modal (desktop, lg:flex)
    ├── Header.tsx         — Page title + search + bell notification + avatar (desktop, hidden lg:flex)
    └── MobileNav.tsx      — Fixed dark top bar + fixed white bottom tab bar (mobile, lg:hidden)
```

### Component API Reference

#### Button
```tsx
<Button
  variant="primary" | "secondary" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  loading={boolean}         // shows spinner, disables button
  type="button" | "submit"
  onClick={fn}
>
```
`primary` uses a CSS gradient (`from-indigo-500 to-violet-500`).

#### Input
```tsx
<Input
  label="Field Label"       // optional, shown above with uppercase tracking
  error="Error message"     // optional, shown below in red
  icon={<Icon size={16} />} // optional, shown inside left of input
  // + all standard <input> props (type, value, onChange, disabled, required, etc.)
/>
```

#### Badge / GradeCircle
```tsx
import Badge, { GradeCircle } from "@/components/ui/Badge"

<Badge variant="success" | "warning" | "danger" | "info" | "neutral" | "primary">
  Text
</Badge>

<GradeCircle grade="A" | "B" | "C" | "D" | "F" />
// Colored circle (emerald/blue/amber/orange/red) with grade letter
```

#### Card / StatCard
```tsx
import Card, { StatCard } from "@/components/ui/Card"

<Card className="...">children</Card>

<StatCard
  label="Total Students"
  value={142}
  icon={<Users />}
  color="indigo" | "violet" | "green" | "amber" | "red"
  trend="+12%"              // optional trend text
/>
```

#### Skeleton
```tsx
import { Skeleton, TableSkeleton, CardGridSkeleton } from "@/components/ui/Skeleton"

<Skeleton className="h-4 w-32" />          // single shimmer bar
<TableSkeleton rows={5} cols={6} />        // full table placeholder
<CardGridSkeleton count={6} />             // grid of card placeholders
```

### Mobile Layout

The application is fully responsive using a dual-layout pattern:

| Screen | Navigation | Header |
|--------|-----------|--------|
| Desktop (`lg:` and up) | `Sidebar` (fixed left, 280px wide) | `Header` (page title + search bar) |
| Mobile (below `lg:`) | `MobileNav` top bar + bottom tab bar | Top bar only (logo + bell + avatar) |

The dashboard layout (`src/app/(dashboard)/layout.tsx`) wraps all authenticated pages:
```tsx
<div className="flex min-h-screen bg-[#F8FAFC]">
  <Sidebar />           {/* hidden on mobile */}
  <MobileNav />         {/* hidden on desktop */}
  <div className="flex-1 lg:ml-[280px] pt-14 lg:pt-0 pb-16 lg:pb-0">
    {children}
  </div>
</div>
```
`pt-14` reserves space for the mobile top bar; `pb-16` reserves space for the mobile bottom tab bar.

### Server vs Client Components

Server Components are used for all data-fetching pages (dashboards, lists, result views) because they can query Prisma directly without an API round-trip. Client Components are used for interactive elements (forms, exam UI, modals, grading panel) because they require state, event handlers, and browser APIs.

---

## Authentication

NextAuth v5 (beta) handles authentication using the **Credentials provider** with JWT sessions.

### Flow

1. User submits email and password on `/login`
2. `signIn("credentials", ...)` is called client-side
3. NextAuth's `authorize` callback verifies the password using `bcrypt.compare`
4. On success, a JWT is issued containing `id`, `email`, `name`, and `role`
5. The JWT is stored as an HTTP-only cookie
6. On each request, middleware reads the JWT and enforces role-based routing

### Session Shape

```typescript
session.user = {
  id: string       // Prisma user CUID
  name: string
  email: string
  role: string     // "ADMIN" | "LECTURER" | "STUDENT"
}
```

---

## Development Timeline

### Phase 1 — Planning & UI Design
- Defined system requirements: three user roles, AI grading, complete CRUD management
- Designed 24 screens in Stitch using the "Academic Precision" design system
- Screens cover: Login, Register, Forgot Password, Admin Dashboard, Manage Departments/Lecturers/Students/Courses, Reports, Lecturer Dashboard, Create Assessment, AI Grading Review, Assessment Results, Student Dashboard, Take Assessment, My Results, Profile pages, Notifications

### Phase 2 — Backend & Database
- Designed and implemented the full Prisma schema (10 models)
- Ran initial migration against Neon PostgreSQL
- Built all API routes: Admin (users, departments, courses, stats), Lecturer (assessments, questions, results, publish), Student (assessments, start, submit, results), Grading (AI endpoint)
- Implemented NextAuth with credentials provider and role-aware JWT
- Integrated Google Gemini (`gemini-2.5-flash-lite`) for subjective answer grading
- Created database seed with admin account

### Phase 3 — Frontend Development
- Set up Tailwind CSS v4 with custom design tokens
- Built shared UI component library (Button, Input, Badge, Card, Skeleton)
- Built Sidebar (role-aware, dark navy) and Header components
- Built MobileNav: fixed dark top bar + bottom tab bar for mobile screens
- Built auth pages: Login (password visibility toggle), Register (dynamic ID field, strength meter), Forgot Password (3-state flow: email → sent → reset)
- Built all Admin pages with full CRUD (inline modals, search, tables/cards, enrollment management)
- Built Lecturer pages: Dashboard, Assessments list, 3-step Create Assessment wizard, Assessment detail with submissions table, AI Grading Review (3-panel split layout), Profile
- Built Student pages: Dashboard, Courses (self-enrollment), Assessments list, Take Assessment (full exam UI with countdown timer, question navigation grid, flag system, auto-submit), My Results (grade breakdown with GradeCircle), Notifications, Profile
- Added student self-enrollment flow: `GET /api/student/courses` returns all courses with `enrolled` flag; students can enroll/unenroll via POST/DELETE
- Added `/api/lecturer/courses` endpoint so lecturers only see their assigned courses in the assessment creation wizard

### Phase 4 — UI Enrichment (Stitch Alignment)
- Rebuilt all 25+ pages and components to exactly match Stitch design output
- Multi-agent parallel rebuild: 4 agents handled shared components, admin, lecturer, and student scopes simultaneously with zero file conflicts
- Admin pages: added stat cards to every management page, avatar initials in tables, course code gradient badges, grade distribution bars with per-grade colors in reports
- Lecturer pages: upgraded wizard step indicators with icons, MCQ option rows fully clickable, 3-panel grading redesign with gradient AI card, approve vs override actions
- Student pages: welcome banner with name, optimistic enrollment with error revert, exam UI with custom radio buttons, mobile sidebar toggle, "time ago" notification formatter
- Auth pages: password visibility toggles on all password fields, smoother strength meter transitions
- MobileNav active indicator positioned at top of tab per Stitch spec
- Sign-out confirmation modal added to Sidebar
- Skeleton loaders on all list and card pages (no plain "Loading…" text)

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `NEXTAUTH_URL` | Application base URL | Yes |
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |

---

## Running the Project

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed initial admin account
npm run db:seed

# Start development server
npm run dev
```

Default seed credentials (all three roles):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@eduassess.com` | `admin123` |
| Lecturer | `lecturer@eduassess.com` | `lecturer123` |
| Student | `student@eduassess.com` | `student123` |

The seed also creates one course (CPE401 — Introduction to Artificial Intelligence) with the lecturer assigned and the student enrolled.
