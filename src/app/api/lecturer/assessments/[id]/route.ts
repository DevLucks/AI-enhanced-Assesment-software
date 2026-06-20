import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAssessmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
  totalMarks: z.number().int().positive().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED"]).optional(),
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
      include: {
        course: true,
        questions: {
          include: {
            options: true,
            keywords: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    return Response.json(assessment);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const existing = await prisma.assessment.findFirst({
      where: { id, lecturerId: session.user.id },
    });
    if (!existing) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const body = await request.json();
    const parsed = updateAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { startTime, endTime, ...rest } = parsed.data;

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        ...rest,
        ...(startTime !== undefined ? { startTime: new Date(startTime) } : {}),
        ...(endTime !== undefined ? { endTime: new Date(endTime) } : {}),
      },
    });

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const existing = await prisma.assessment.findFirst({
      where: { id, lecturerId: session.user.id },
    });
    if (!existing) return Response.json({ error: "Assessment not found" }, { status: 404 });
    if (existing.status !== "DRAFT") {
      return Response.json({ error: "Only DRAFT assessments can be deleted" }, { status: 400 });
    }

    await prisma.assessment.delete({ where: { id } });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
