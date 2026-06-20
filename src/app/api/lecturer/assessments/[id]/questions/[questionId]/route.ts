import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const optionSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const keywordSchema = z.object({
  keyword: z.string().min(1),
  weight: z.number().positive(),
});

const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  marks: z.number().int().positive().optional(),
  modelAnswer: z.string().optional(),
  options: z.array(optionSchema).optional(),
  keywords: z.array(keywordSchema).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id, questionId } = await params;

    const assessment = await prisma.assessment.findFirst({
      where: { id, lecturerId: session.user.id },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const question = await prisma.question.findFirst({
      where: { id: questionId, assessmentId: id },
    });
    if (!question) return Response.json({ error: "Question not found" }, { status: 404 });

    const body = await request.json();
    const parsed = updateQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { text, marks, modelAnswer, options, keywords } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      if (options !== undefined) {
        await tx.option.deleteMany({ where: { questionId } });
      }
      if (keywords !== undefined) {
        await tx.gradingKeyword.deleteMany({ where: { questionId } });
      }

      return tx.question.update({
        where: { id: questionId },
        data: {
          ...(text !== undefined ? { text } : {}),
          ...(marks !== undefined ? { marks } : {}),
          ...(modelAnswer !== undefined ? { modelAnswer } : {}),
          ...(options?.length ? { options: { create: options } } : {}),
          ...(keywords?.length ? { keywords: { create: keywords } } : {}),
        },
        include: { options: true, keywords: true },
      });
    });

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id, questionId } = await params;

    const assessment = await prisma.assessment.findFirst({
      where: { id, lecturerId: session.user.id },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const question = await prisma.question.findFirst({
      where: { id: questionId, assessmentId: id },
    });
    if (!question) return Response.json({ error: "Question not found" }, { status: 404 });

    await prisma.question.delete({ where: { id: questionId } });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
