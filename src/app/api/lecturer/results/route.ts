import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeGrade } from "@/lib/grading";
import { z } from "zod";

const patchSchema = z.object({
  answerId: z.string().min(1),
  marksAwarded: z.number().min(0),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { answerId, marksAwarded } = parsed.data;

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: { select: { marks: true } },
        submission: {
          select: {
            id: true,
            assessment: { select: { lecturerId: true, totalMarks: true } },
          },
        },
      },
    });
    if (!answer) return Response.json({ error: "Answer not found" }, { status: 404 });
    if (answer.submission.assessment.lecturerId !== session.user.id) {
      return Response.json({ error: "Answer not found" }, { status: 404 });
    }
    if (marksAwarded > answer.question.marks) {
      return Response.json({ error: `Marks cannot exceed ${answer.question.marks}` }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.answer.update({
        where: { id: answerId },
        data: { marksAwarded, gradedAt: new Date() },
      });

      const allAnswers = await tx.answer.findMany({
        where: { submissionId: answer.submission.id },
        include: { question: { select: { type: true } } },
      });

      const objectiveMarks = allAnswers
        .filter((a) => a.question.type === "OBJECTIVE")
        .reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);
      const subjectiveMarks = allAnswers
        .filter((a) => a.question.type === "SUBJECTIVE")
        .reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);
      const totalMarks = objectiveMarks + subjectiveMarks;

      await tx.result.update({
        where: { submissionId: answer.submission.id },
        data: {
          objectiveMarks,
          subjectiveMarks,
          totalMarks,
          grade: computeGrade(totalMarks, answer.submission.assessment.totalMarks),
        },
      });
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessmentId");

    if (!assessmentId) {
      return Response.json({ error: "assessmentId query parameter is required" }, { status: 400 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, lecturerId: session.user.id },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const submissions = await prisma.submission.findMany({
      where: { assessmentId },
      include: {
        student: {
          select: { id: true, name: true, email: true, matricNumber: true },
        },
        result: true,
        answers: {
          include: {
            question: {
              select: { id: true, text: true, type: true, marks: true },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return Response.json(submissions);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
