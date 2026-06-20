import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") return Response.json({ error: "Forbidden" }, { status: 403 });

    const [allCourses, enrolledCourses] = await Promise.all([
      prisma.course.findMany({
        include: {
          department: { select: { name: true } },
          lecturers: { select: { name: true } },
          _count: { select: { students: true, assessments: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.course.findMany({
        where: { students: { some: { id: session.user.id } } },
        select: { id: true },
      }),
    ]);

    const enrolledIds = new Set(enrolledCourses.map((c) => c.id));

    return Response.json(
      allCourses.map((c) => ({ ...c, enrolled: enrolledIds.has(c.id) }))
    );
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
