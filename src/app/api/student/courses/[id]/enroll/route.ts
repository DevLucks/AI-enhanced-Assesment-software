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

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

    await prisma.course.update({
      where: { id },
      data: { students: { connect: { id: session.user.id } } },
    });

    return Response.json({ enrolled: true });
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
    if (session.user.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    await prisma.course.update({
      where: { id },
      data: { students: { disconnect: { id: session.user.id } } },
    });

    return Response.json({ enrolled: false });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
