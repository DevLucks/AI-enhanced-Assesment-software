# EduAssess — User Guide

Welcome to **EduAssess**, your institution's AI-powered assessment platform. This guide explains how to log in, navigate the system, and use every feature available to you — whether you are an Administrator, Lecturer, or Student.

---

## Getting Started

### Accessing the Application

Open your web browser and navigate to the EduAssess web address provided by your institution. You will be taken directly to the sign-in page.

### Signing In

1. Enter your **email address** and **password**
2. Click **Sign In**
3. The system will automatically take you to your dashboard based on your role

If you cannot log in, check that you are using the correct email address and that Caps Lock is not on.

### Creating an Account

If you do not yet have an account:

1. Click **Request access** on the sign-in page
2. Fill in your Full Name, Email Address, Student/Lecturer ID, and choose your role
3. Create a password (at least 8 characters)
4. Click **Create Account**
5. You will be redirected to sign in once your account is created

> **Note:** Admin accounts must be created directly by the system administrator and cannot be self-registered.

### Forgot Your Password?

1. Click **Forgot password?** on the sign-in page
2. Enter your registered email address
3. Click **Send Reset Link**
4. Check your inbox for the reset email and follow the instructions

---

## For Administrators

As an Administrator, you manage the institutional data that the entire system depends on: departments, users, and courses. You access all of these from the dark left-hand navigation panel.

### Managing Departments

Departments are the top-level organisational unit. Every course and user belongs to a department.

**To create a department:**
1. Click **Departments** in the sidebar
2. Click **Add Department** (top right)
3. Enter the department name (e.g. "Computer Engineering") and code (e.g. "CPE")
4. Click **Save**

**To edit a department:** Click the pencil icon on any department card.

**To delete a department:** Click the bin icon, then confirm. Note that deleting a department will unlink its users and courses.

---

### Managing Lecturers

**To add a lecturer:**
1. Click **Lecturers** in the sidebar
2. Click **Add Lecturer**
3. Enter the lecturer's Full Name, Email, Staff ID, Password, and select their Department
4. Click **Save**

The lecturer will be able to sign in immediately using the email and password you set.

**To edit a lecturer:** Click the pencil icon in their row to update their name or department.

**To remove a lecturer:** Click the bin icon and confirm.

You can search for any lecturer by name or email using the search bar at the top of the page.

---

### Managing Students

**To add a student:**
1. Click **Students** in the sidebar
2. Click **Add Student**
3. Enter the student's Full Name, Email, Matric Number, Password, and select their Department
4. Click **Save**

**To edit or remove a student:** Use the pencil or bin icons in their row.

You can search by name or matric number.

---

### Managing Courses

**To create a course:**
1. Click **Courses** in the sidebar
2. Click **Add Course**
3. Enter the course name (e.g. "Data Structures and Algorithms"), course code (e.g. "CPE301"), and select the department it belongs to
4. Click **Save**

Lecturers and students are assigned to courses from within the lecturer/student management pages.

---

### Reports & Analytics

Click **Reports** in the sidebar to view institution-wide performance data including:

- Total submissions and graded count
- Overall pass rate and average score
- Grade distribution (A through F) with visual progress bars
- Top courses by student and assessment count
- A table of the most recent student results across all assessments

---

## For Lecturers

As a Lecturer, your work centres around creating assessments, monitoring submissions, and reviewing AI-generated grades. Everything is accessible from the left-hand sidebar.

### Your Dashboard

When you sign in, your dashboard shows:

- A count of your assessments, courses, and total student submissions
- A table of all your assessments with their current status and submission count
- A shortcut to create a new assessment

---

### Creating an Assessment

1. Click **Create Assessment** in the sidebar (or the button on your dashboard)
2. You will walk through a **3-step wizard**:

**Step 1 — Details**
- Enter the assessment **title** (e.g. "Midterm Examination")
- Select the **course** this assessment belongs to
- Set the **duration** in minutes (e.g. 90)
- Set the **total marks** (e.g. 100)
- Optionally set a **start time** and **end time** to control when students can access it
- Optionally add a **description** with instructions for students

**Step 2 — Questions**
- Click **Add Question** to add your first question
- For each question:
  - Write the question text
  - Choose the type:
    - **Objective (MCQ)** — provide 4 options (A, B, C, D) and mark the correct one by selecting the radio button next to it
    - **Subjective (Essay)** — write a model answer; this is what the AI will compare student responses against
  - Set the mark value for the question
- Add as many questions as needed

**Step 3 — Review**
- Confirm all details are correct
- Click **Save Assessment** — it is saved as a **DRAFT**

---

### Publishing an Assessment

Once your assessment is ready:

1. Go to **My Assessments** in the sidebar
2. Click **View** on the assessment you want to publish
3. Click **Publish** (top right)
4. The status changes to **PUBLISHED** and students can now see and attempt it

To stop students from submitting (for example, once the exam period has ended), click **Close Assessment**. The status becomes **CLOSED** and you can then proceed to review grades.

---

### Reviewing AI Grades

After closing an assessment that contains essay questions:

1. Go to the assessment and click **AI Grading Review**
2. The screen is split into three panels:
   - **Left:** List of all students who submitted
   - **Centre:** List of that student's answers
   - **Right:** The full AI analysis for the selected answer

For each answer you will see:
- The student's written response
- The **AI-assigned score** out of the question's total marks
- A **confidence percentage** — how certain the AI is about its grade
- **AI feedback** — a brief explanation of why the score was given

**To override a grade:**
1. Enter a new score in the "Override Grade" box
2. Optionally add a note explaining your reasoning
3. Click **Save Override**

**To approve the AI grade without changes:**
- Click **Approve AI Grade**

Once you have reviewed all answers, click **Publish All Results to Students** at the bottom of the right panel. Students will then be able to see their grades.

---

### Your Profile

Click **Profile** in the sidebar to:

- View and update your name
- See your assigned courses
- Change your password

---

## For Students

As a Student, you use EduAssess to take assessments and view your results.

### Your Dashboard

Your dashboard gives you an immediate view of:

- How many assessments are currently available for you to take
- How many you have already submitted
- How many results you have received
- A list of available assessments with a direct link to start
- Your most recent results with grades

---

### Taking an Assessment

1. On your dashboard or on the **My Assessments** page, click on an available assessment
2. The system starts your submission timer immediately
3. You are taken to the **exam screen**

**Exam Screen Layout:**

- **Top bar:** Assessment name, live countdown timer (turns red in the last 10 minutes), and a Submit button
- **Left panel:** A grid showing all question numbers, colour-coded:
  - **Green** = answered
  - **Amber** = flagged for review
  - **Grey** = not yet answered
- **Main area:** The current question with answer options or a text box

**Answering Questions:**

For **multiple choice questions:** Click on the option you believe is correct. Your selection is highlighted in indigo. You can change your answer at any time before submitting.

For **essay questions:** Type your answer in the text area provided. There is no word limit, but focus on covering the key points clearly and accurately.

**Navigating Questions:**

- Use the **Previous** and **Next** buttons at the bottom to move between questions
- Click any number in the question grid on the left to jump directly to that question
- Click **Flag for Review** to mark a question you want to come back to — it will appear amber in the grid

**Submitting:**

- When you have answered all questions, click **Submit Exam**
- You will be asked to confirm — once submitted, you cannot change your answers
- If your timer reaches zero, the exam is submitted automatically

> **Important:** Do not close the browser tab during an exam. Your answers are only saved when you submit.

---

### Viewing Your Results

Click **My Results** in the sidebar to see all your graded assessments.

Each result card shows:

- The assessment title and course
- The date your result was published
- Your **total score** out of the maximum marks
- Your **percentage**
- Your **grade** (A, B, C, D, or F) displayed as a colour-coded circle
- A breakdown of your **Objective (MCQ) marks** and **Subjective (AI-graded) marks**
- A progress bar showing where your score falls

Grades are assigned as follows:

| Grade | Score Range |
|-------|-------------|
| A | 70% and above |
| B | 60% – 69% |
| C | 50% – 59% |
| D | 40% – 49% |
| F | Below 40% |

---

### Notifications

Click **Notifications** in the sidebar to see:

- Alerts for **new assessments** that are available for you to take
- Alerts for **results** that have been published by your lecturer

---

### Your Profile

Click **Profile** in the sidebar to:

- Update your display name
- View your enrolled courses
- Change your password

---

## Frequently Asked Questions

**Can I go back and change my answers during an exam?**
Yes — you can navigate freely between questions and change any answer up until you click Submit or the timer expires.

**What happens if my internet disconnects during an exam?**
Your answers are only saved on submission. If you lose connection, reconnect as quickly as possible and return to the exam — your session will still be active as long as the timer has not expired.

**Can I see the AI feedback on my essay answers?**
Currently, the detailed AI feedback is visible to lecturers only. You will see your overall score and grade breakdown in your results.

**Who do I contact if my grade seems incorrect?**
Contact your lecturer directly. They have the ability to review and override any grade, including AI-generated ones.

**Can I take the same assessment twice?**
No. Each student can only submit one response per assessment. Once submitted, the assessment is locked.

**Why can I not see any assessments?**
Assessments are only visible when their status is Published or Active, and only if you are enrolled in the course the assessment belongs to. If you cannot see an expected assessment, contact your lecturer or administrator to confirm your course enrolment.
