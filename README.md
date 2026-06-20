# EduAssess — AI-Powered Academic Assessment System

EduAssess is a full-stack web application built as a final year project. It is an intelligent academic assessment platform that enables lecturers to create and manage assessments, uses Google Gemini AI to automatically grade subjective (essay) answers, and provides students with a seamless exam-taking experience.

---

## Features

### Admin
- Manage departments, lecturer accounts, student accounts, and courses
- Assign lecturers and enroll students into courses
- View system-wide reports and grade analytics

### Lecturer
- Create multi-question assessments (MCQ + essay) with a 3-step wizard
- Publish assessments and monitor student submissions
- Review AI-generated grades, approve or override scores
- View per-student result breakdowns

### Student
- Self-register and enroll in courses
- Take timed assessments with a live countdown timer, question navigation grid, and flag-for-review system
- View graded results with score breakdown and grade (A–F)
- Receive notifications for new assessments and published results

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth v5 (JWT, Credentials) |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma v7 with PrismaPg adapter |
| AI | Google Gemini (`gemini-2.5-flash-lite`) |
| Icons | Lucide React |
| Fonts | Plus Jakarta Sans + Inter |

---

## Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Google AI Studio](https://aistudio.google.com) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/DevLucks/AI-enhanced-Assesment-software.git
cd AI-enhanced-Assesment-software

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=your_neon_postgresql_connection_string
NEXTAUTH_SECRET=your_random_secret_min_32_characters
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your_google_gemini_api_key
```

### Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Seed test accounts
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eduassess.com | admin123 |
| Lecturer | lecturer@eduassess.com | lecturer123 |
| Student | student@eduassess.com | student123 |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, forgot password
│   ├── (dashboard)/     # Protected pages per role
│   │   ├── admin/       # Admin management pages
│   │   ├── lecturer/    # Lecturer assessment pages
│   │   └── student/     # Student exam pages
│   └── api/             # REST API route handlers
├── components/
│   ├── layout/          # Sidebar, Header, MobileNav
│   └── ui/              # Button, Input, Badge, Card, Skeleton
├── lib/                 # Prisma client, Auth config
└── types/               # TypeScript type extensions
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Test data seeder
```

---

## User Roles & Access

```
/admin/*      → ADMIN only
/lecturer/*   → LECTURER only
/student/*    → STUDENT only
```

Role-based redirects are enforced in both middleware and the dashboard layout.

---

## AI Grading

When a student submits an assessment, MCQ answers are graded instantly by comparing against the correct option. Essay answers are sent to Google Gemini with the question, lecturer's model answer, and student response. Gemini returns a score, confidence level (0–1), and feedback text. Lecturers can approve AI scores or override them manually before results are released to students.

---

## License

Built as a final year undergraduate project. For academic and demonstration purposes.
