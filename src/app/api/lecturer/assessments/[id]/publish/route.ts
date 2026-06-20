import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
      include: { _count: { select: { questions: true } } },
    });
    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    if (assessment._count.questions === 0) {
      return Response.json({ error: "Assessment must have at least one question before publishing" }, { status: 400 });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
