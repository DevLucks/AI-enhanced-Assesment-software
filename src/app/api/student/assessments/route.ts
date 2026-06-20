import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });

    const assessments = await prisma.assessment.findMany({
      where: {
        status: { in: ["PUBLISHED", "ACTIVE"] },
        course: {
          students: { some: { id: session.user.id } },
        },
      },
      include: {
        course: {
          select: { id: true, name: true, code: true },
        },
        lecturer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const submissionsMap = await prisma.submission.findMany({
      where: {
        studentId: session.user.id,
        assessmentId: { in: assessments.map((a) => a.id) },
      },
      select: { assessmentId: true, id: true },
    });

    const submissionsByAssessment = new Map(
      submissionsMap.map((s) => [s.assessmentId, s.id])
    );

    const result = assessments.map(({ lecturer, ...assessment }) => ({
      ...assessment,
      lecturerName: lecturer.name,
      hasSubmitted: submissionsByAssessment.has(assessment.id),
      submissionId: submissionsByAssessment.get(assessment.id) ?? null,
    }));

    return Response.json(result);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
