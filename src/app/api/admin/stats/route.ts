import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const [
      totalStudents,
      totalLecturers,
      totalDepartments,
      totalCourses,
      totalAssessments,
      activeAssessments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "LECTURER" } }),
      prisma.department.count(),
      prisma.course.count(),
      prisma.assessment.count(),
      prisma.assessment.count({ where: { status: "ACTIVE" } }),
    ]);

    return Response.json({
      totalStudents,
      totalLecturers,
      totalDepartments,
      totalCourses,
      totalAssessments,
      activeAssessments,
    });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
