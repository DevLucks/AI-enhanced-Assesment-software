import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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
      include: {
        course: { select: { id: true, name: true, code: true } },
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            marks: true,
            order: true,
            options: {
              select: { id: true, label: true, text: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

    const sanitized = {
      ...assessment,
      questions: assessment.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        order: q.order,
        ...(q.type === "OBJECTIVE"
          ? { options: q.options }
          : {}),
      })),
    };

    return Response.json(sanitized);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
