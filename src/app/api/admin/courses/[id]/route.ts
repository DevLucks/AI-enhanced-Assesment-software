import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  departmentId: z.string().optional(),
  lecturerIds: z.array(z.string()).optional(),
  studentIds: z.array(z.string()).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        lecturers: {
          select: { id: true, name: true, email: true, staffId: true },
        },
        students: {
          select: { id: true, name: true, email: true, matricNumber: true },
        },
        assessments: {
          select: { id: true, title: true, status: true, createdAt: true },
        },
        _count: {
          select: { students: true, assessments: true },
        },
      },
    });

    if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

    return Response.json(course);
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { lecturerIds, studentIds, ...coreFields } = parsed.data;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...coreFields,
        ...(lecturerIds !== undefined && {
          lecturers: {
            set: lecturerIds.map((lid) => ({ id: lid })),
          },
        }),
        ...(studentIds !== undefined && {
          students: {
            set: studentIds.map((sid) => ({ id: sid })),
          },
        }),
      },
      include: {
        department: true,
        lecturers: {
          select: { id: true, name: true, email: true },
        },
        students: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { students: true, assessments: true },
        },
      },
    });

    return Response.json(course);
  } catch (error) {
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
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    await prisma.course.delete({ where: { id } });

    return Response.json({ message: "Course deleted" });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
