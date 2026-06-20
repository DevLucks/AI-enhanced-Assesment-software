import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });

    const results = await prisma.result.findMany({
      where: {
        submission: { studentId: session.user.id },
      },
      include: {
        submission: {
          select: {
            submittedAt: true,
            assessment: {
              select: {
                id: true,
                title: true,
                totalMarks: true,
                course: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = results.map((r) => ({
      id: r.id,
      grade: r.grade,
      totalMarks: r.totalMarks,
      objectiveMarks: r.objectiveMarks,
      subjectiveMarks: r.subjectiveMarks,
      createdAt: r.createdAt,
      submittedAt: r.submission.submittedAt,
      assessment: {
        id: r.submission.assessment.id,
        title: r.submission.assessment.title,
        totalMarks: r.submission.assessment.totalMarks,
        course: r.submission.assessment.course,
      },
    }));

    return Response.json(formatted);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
