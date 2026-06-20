import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAssessmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  courseId: z.string().min(1),
  duration: z.number().int().positive(),
  totalMarks: z.number().int().positive(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const assessments = await prisma.assessment.findMany({
      where: { lecturerId: session.user.id },
      include: {
        course: true,
        _count: {
          select: { questions: true, submissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(assessments);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = createAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { startTime, endTime, ...rest } = parsed.data;

    const assessment = await prisma.assessment.create({
      data: {
        ...rest,
        lecturerId: session.user.id,
        status: "DRAFT",
        ...(startTime ? { startTime: new Date(startTime) } : {}),
        ...(endTime ? { endTime: new Date(endTime) } : {}),
      },
      include: { course: true },
    });

    return Response.json(assessment, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
