import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const result = await prisma.result.findFirst({
      where: {
        id,
        submission: { studentId: session.user.id },
      },
      include: {
        submission: {
          include: {
            assessment: {
              include: {
                course: { select: { name: true, code: true } },
                questions: {
                  orderBy: { order: "asc" },
                  include: {
                    options: { select: { id: true, label: true, text: true, isCorrect: true } },
                  },
                },
              },
            },
            answers: true,
          },
        },
      },
    });

    if (!result) return Response.json({ error: "Result not found" }, { status: 404 });

    const answerMap = new Map(result.submission.answers.map((a) => [a.questionId, a]));

    const questions = result.submission.assessment.questions.map((q) => {
      const answer = answerMap.get(q.id);
      const correctOption = q.options.find((o) => o.isCorrect);
      const selectedOption = q.options.find((o) => o.id === answer?.selectedOption);
      const isCorrect =
        q.type === "OBJECTIVE"
          ? selectedOption?.isCorrect === true
          : null;

      return {
        id: q.id,
        order: q.order,
        text: q.text,
        type: q.type,
        marks: q.marks,
        modelAnswer: q.modelAnswer,
        options: q.type === "OBJECTIVE" ? q.options : [],
        answer: {
          selectedOptionId: answer?.selectedOption ?? null,
          selectedOptionLabel: selectedOption?.label ?? null,
          selectedOptionText: selectedOption?.text ?? null,
          answerText: answer?.answerText ?? null,
          marksAwarded: answer?.marksAwarded ?? null,
          aiFeedback: answer?.aiFeedback ?? null,
          aiConfidence: answer?.aiConfidence ?? null,
          isCorrect,
        },
        correctOption: correctOption
          ? { id: correctOption.id, label: correctOption.label, text: correctOption.text }
          : null,
      };
    });

    return Response.json({
      id: result.id,
      grade: result.grade,
      totalMarks: result.totalMarks,
      objectiveMarks: result.objectiveMarks,
      subjectiveMarks: result.subjectiveMarks,
      createdAt: result.createdAt,
      assessment: {
        title: result.submission.assessment.title,
        totalMarks: result.submission.assessment.totalMarks,
        course: result.submission.assessment.course,
      },
      questions,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
