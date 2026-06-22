import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeSubjectiveAnswer } from "@/lib/gemini";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().min(1),
  answerText: z.string().optional(),
  selectedOptionId: z.string().optional(),
});

const submitSchema = z.object({
  submissionId: z.string().min(1),
  answers: z.array(answerSchema).min(1),
});

function computeGrade(scored: number, total: number): string {
  const pct = total > 0 ? (scored / total) * 100 : 0;
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 45) return "D";
  return "F";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { submissionId, answers } = parsed.data;

    const submission = await prisma.submission.findFirst({
      where: { id: submissionId, studentId: session.user.id, assessmentId: id },
    });
    if (!submission) return Response.json({ error: "Submission not found" }, { status: 404 });
    if (submission.status !== "IN_PROGRESS") {
      return Response.json({ error: "Submission already completed" }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      select: { totalMarks: true },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const questions = await prisma.question.findMany({
      where: {
        assessmentId: id,
        id: { in: answers.map((a) => a.questionId) },
      },
      include: {
        options: { select: { id: true, isCorrect: true } },
        keywords: true,
      },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const correctOptionIds = new Set<string>();
    for (const q of questions) {
      if (q.type === "OBJECTIVE") {
        for (const opt of q.options) {
          if (opt.isCorrect) correctOptionIds.add(opt.id);
        }
      }
    }

    let objectiveMarks = 0;

    const answerData = answers.map((a) => {
      const question = questionMap.get(a.questionId);
      let marksAwarded: number | null = null;

      if (question?.type === "OBJECTIVE") {
        marksAwarded =
          a.selectedOptionId && correctOptionIds.has(a.selectedOptionId)
            ? question.marks
            : 0;
        objectiveMarks += marksAwarded;
      }

      return {
        submissionId,
        questionId: a.questionId,
        answerText: a.answerText ?? null,
        selectedOption: a.selectedOptionId ?? null,
        marksAwarded,
      };
    });

    await prisma.$transaction(async (tx) => {
      await tx.answer.createMany({ data: answerData, skipDuplicates: true });
      await tx.submission.update({
        where: { id: submissionId },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });
      await tx.result.create({
        data: {
          submissionId,
          totalMarks: objectiveMarks,
          objectiveMarks,
          subjectiveMarks: 0,
          grade: computeGrade(objectiveMarks, assessment.totalMarks),
        },
      });
    });

    // Grade subjective (essay) answers with Gemini
    const subjectiveAnswers = answers.filter((a) => {
      const q = questionMap.get(a.questionId);
      return q?.type === "SUBJECTIVE";
    });

    let subjectiveMarks = 0;

    if (subjectiveAnswers.length > 0) {
      const gradingResults = await Promise.allSettled(
        subjectiveAnswers.map(async (a) => {
          const question = questionMap.get(a.questionId)!;

          if (!a.answerText) {
            await prisma.answer.updateMany({
              where: { submissionId, questionId: question.id },
              data: { marksAwarded: 0, aiFeedback: "No answer provided.", aiConfidence: 1, gradedAt: new Date() },
            });
            return 0;
          }

          const result = await gradeSubjectiveAnswer(
            question.text,
            question.modelAnswer ?? "",
            a.answerText,
            question.keywords,
            question.marks
          );

          await prisma.answer.updateMany({
            where: { submissionId, questionId: question.id },
            data: {
              marksAwarded: result.score,
              aiFeedback: result.feedback,
              aiConfidence: result.confidence,
              gradedAt: new Date(),
            },
          });

          return result.score;
        })
      );

      subjectiveMarks = gradingResults.reduce((sum, r) => {
        return r.status === "fulfilled" ? sum + r.value : sum;
      }, 0);

      const totalMarks = objectiveMarks + subjectiveMarks;
      await prisma.result.update({
        where: { submissionId },
        data: {
          subjectiveMarks,
          totalMarks,
          grade: computeGrade(totalMarks, assessment.totalMarks),
        },
      });
    }

    return Response.json({
      success: true,
      submissionId,
      objectiveMarks,
      subjectiveMarks,
      totalMarks: objectiveMarks + subjectiveMarks,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
