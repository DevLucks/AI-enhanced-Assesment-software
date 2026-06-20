import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCourseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  departmentId: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const courses = await prisma.course.findMany({
      include: {
        department: true,
        lecturers: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { students: true, assessments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(courses);
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: parsed.data,
      include: {
        department: true,
      },
    });

    return Response.json(course, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
