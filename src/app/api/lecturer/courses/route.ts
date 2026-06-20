import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "LECTURER") return Response.json({ error: "Forbidden" }, { status: 403 });

    const courses = await prisma.course.findMany({
      where: { lecturers: { some: { id: session.user.id } } },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    return Response.json(courses);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
