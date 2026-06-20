# EduAssess — Application Overview

## What is EduAssess?

EduAssess is an AI-powered academic assessment management system designed for higher education institutions. It digitises the full assessment lifecycle — from creating and scheduling exams to collecting student submissions, grading answers using artificial intelligence, and publishing results — all within a single, role-based web platform.

The core differentiator of EduAssess is its AI grading engine. For subjective (essay-style) questions, the system uses Google Gemini to evaluate student responses against a model answer, award marks, provide feedback, and indicate a confidence score. Lecturers can then review, override, or approve those AI-generated grades before they are published to students.

---

## Who Uses EduAssess?

EduAssess has three distinct user roles, each with its own dashboard and set of capabilities.

### 1. Administrator

The administrator oversees the entire institution's data within the system. This includes:

- Managing academic **departments** — creating, editing, and deleting departments
- Managing **lecturers** — adding, editing, and removing lecturer accounts and assigning them to departments
- Managing **students** — adding, editing, and removing student accounts and assigning them to departments
- Managing **courses** — creating courses, assigning them to departments
- Viewing **reports and analytics** — overall pass/fail rates, grade distributions, average scores, and top-performing courses

The administrator does not create assessments or take exams. Their role is institutional governance — ensuring the data structure (departments, users, courses) is correctly configured so that lecturers and students can work effectively.

### 2. Lecturer

Lecturers are responsible for the full assessment workflow within their courses. They can:

- View their **lecturer dashboard** with a summary of their assessments and total student submissions
- **Create assessments** using a three-step guided wizard:
  - Step 1: Define the assessment title, course, duration, total marks, and optional start/end times
  - Step 2: Add questions — either Objective (Multiple Choice) or Subjective (Essay), each with a mark value, and for subjective questions, a model answer for AI grading
  - Step 3: Review and save the assessment as a DRAFT
- **Publish assessments** — changing the status from DRAFT to PUBLISHED, making it visible to enrolled students
- **View submissions** — see which students have submitted and their scores
- **AI Grading Review** — for closed assessments, review every student's answer alongside the AI-assigned grade, confidence score, and feedback; override any grade with a justification; or approve AI grades in bulk
- **Publish results** — release final grades to students after review
- View and update their **profile**

### 3. Student

Students interact with EduAssess primarily to take assessments and review their results. They can:

- View their **student dashboard** showing available assessments and recent results at a glance
- View **all available assessments** for their enrolled courses
- **Take an assessment** — a distraction-free exam interface that includes:
  - A countdown timer that auto-submits when time expires
  - A question navigation grid (colour-coded: answered, flagged, unanswered)
  - Multiple choice selection for objective questions
  - A text area for written/essay answers
  - A "Flag for Review" feature to mark questions to revisit
- View **My Results** — detailed result cards showing total score, grade, breakdown of objective vs. subjective marks, and a percentage progress bar
- View **Notifications** — alerts for new assessments available and results published
- View and update their **profile**

---

## Key Features Summary

| Feature | Description |
|---------|-------------|
| Role-based access | Admins, lecturers, and students each see only what is relevant to them |
| AI grading | Subjective answers are graded by Google Gemini against a model answer |
| Confidence scoring | AI provides a 0–100% confidence value per grade so lecturers can prioritise review |
| Override workflow | Lecturers can override any AI grade with a score and written justification |
| Auto-submit | Student exams auto-submit when the countdown timer reaches zero |
| Grade badges | Grades A–F are displayed as colour-coded circles throughout the system |
| Result breakdown | Results show separate scores for objective and subjective sections |
| Responsive UI | Sidebar collapses on smaller screens; the exam interface is fully standalone |

---

## Assessment Lifecycle

```
Admin sets up departments → courses → assigns lecturers and students

Lecturer creates assessment (DRAFT)
      ↓
Lecturer publishes (PUBLISHED)
      ↓
Students take assessment → submissions recorded
      ↓
Lecturer closes assessment (CLOSED)
      ↓
AI grades subjective answers automatically
      ↓
Lecturer reviews AI grades → approves or overrides
      ↓
Lecturer publishes results
      ↓
Students view grades and feedback
```

---

## Access & Security

- All routes are protected. Unauthenticated users are redirected to `/login`.
- Role enforcement is handled at middleware level — a student cannot access lecturer or admin routes, and vice versa.
- Passwords are hashed using bcrypt before storage. Plain-text passwords are never stored.
- Sessions are JWT-based and managed by NextAuth.
- Exam questions are sanitised before being sent to the student's browser — correct answers and model answers are stripped from the response so they cannot be inspected in browser developer tools.
