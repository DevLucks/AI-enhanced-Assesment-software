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

const createQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["OBJECTIVE", "SUBJECTIVE"]),
  marks: z.number().int().positive(),
  order: z.number().int().nonnegative(),
  options: z.array(optionSchema).optional(),
  modelAnswer: z.string().optional(),
  keywords: z.array(keywordSchema).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const assessment = await prisma.assessment.findFirst({
      where: { id, lecturerId: session.user.id },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const questions = await prisma.question.findMany({
      where: { assessmentId: id },
      include: { options: true, keywords: true },
      orderBy: { order: "asc" },
    });

    return Response.json(questions);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const assessment = await prisma.assessment.findFirst({
      where: { id, lecturerId: session.user.id },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const body = await request.json();
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { text, type, marks, order, options, modelAnswer, keywords } = parsed.data;

    const question = await prisma.question.create({
      data: {
        text,
        type,
        marks,
        order,
        assessmentId: id,
        ...(type === "SUBJECTIVE" && modelAnswer ? { modelAnswer } : {}),
        ...(type === "OBJECTIVE" && options?.length
          ? { options: { create: options } }
          : {}),
        ...(type === "SUBJECTIVE" && keywords?.length
          ? { keywords: { create: keywords } }
          : {}),
      },
      include: { options: true, keywords: true },
    });

    return Response.json(question, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
