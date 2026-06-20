import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id,
        status: { in: ["PUBLISHED", "ACTIVE"] },
        course: {
          students: { some: { id: session.user.id } },
        },
      },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const existing = await prisma.submission.findUnique({
      where: { studentId_assessmentId: { studentId: session.user.id, assessmentId: id } },
    });

    if (existing) {
      return Response.json({ submissionId: existing.id });
    }

    const submission = await prisma.submission.create({
      data: {
        studentId: session.user.id,
        assessmentId: id,
        status: "IN_PROGRESS",
      },
    });

    return Response.json({ submissionId: submission.id }, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
