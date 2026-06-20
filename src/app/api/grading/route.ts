import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeSubjectiveAnswer } from "@/lib/gemini";
import { z } from "zod";

const schema = z.object({
  submissionId: z.string(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "LECTURER" && session.user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId } = schema.parse(body);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assessment: {
          include: { questions: { include: { keywords: true } } },
        },
        answers: true,
      },
    });

    if (!submission) {
      return Response.json({ error: "Submission not found" }, { status: 404 });
    }

    const subjectiveQuestions = submission.assessment.questions.filter(
      (q) => q.type === "SUBJECTIVE"
    );

    const gradingResults = await Promise.allSettled(
      subjectiveQuestions.map(async (question) => {
        const answer = submission.answers.find(
          (a) => a.questionId === question.id
        );

        if (!answer || !answer.answerText) {
          await prisma.answer.updateMany({
            where: { submissionId, questionId: question.id },
            data: { marksAwarded: 0, aiFeedback: "No answer provided.", aiConfidence: 1, gradedAt: new Date() },
          });
          return { questionId: question.id, score: 0 };
        }

        const result = await gradeSubjectiveAnswer(
          question.text,
          question.modelAnswer ?? "",
          answer.answerText,
          question.keywords,
          question.marks
        );

        await prisma.answer.update({
          where: { id: answer.id },
          data: {
            marksAwarded: result.score,
            aiFeedback: result.feedback,
            aiConfidence: result.confidence,
            gradedAt: new Date(),
          },
        });

        return { questionId: question.id, score: result.score };
      })
    );

    const subjectiveMarks = gradingResults.reduce((sum, r) => {
      if (r.status === "fulfilled") return sum + r.value.score;
      return sum;
    }, 0);

    const existingResult = await prisma.result.findUnique({
      where: { submissionId },
    });

    const objectiveMarks = existingResult?.objectiveMarks ?? 0;
    const totalMarks = objectiveMarks + subjectiveMarks;
    const percentage = (totalMarks / submission.assessment.totalMarks) * 100;
    const grade =
      percentage >= 70 ? "A" :
      percentage >= 60 ? "B" :
      percentage >= 50 ? "C" :
      percentage >= 45 ? "D" : "F";

    if (existingResult) {
      await prisma.result.update({
        where: { submissionId },
        data: { subjectiveMarks, totalMarks, grade },
      });
    } else {
      await prisma.result.create({
        data: {
          submissionId,
          objectiveMarks,
          subjectiveMarks,
          totalMarks,
          grade,
        },
      });
    }

    const failures = gradingResults.filter((r) => r.status === "rejected");

    return Response.json({
      success: true,
      subjectiveMarks,
      totalMarks,
      grade,
      gradedCount: subjectiveQuestions.length - failures.length,
      failedCount: failures.length,
    });
  } catch (error) {
    console.error("Grading error:", error);
    return Response.json({ error: "Grading failed" }, { status: 500 });
  }
}
