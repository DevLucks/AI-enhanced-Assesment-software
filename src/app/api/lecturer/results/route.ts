import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
