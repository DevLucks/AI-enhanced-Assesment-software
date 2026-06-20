import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
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

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        courses: true,
      },
    });

    if (!department) return Response.json({ error: "Department not found" }, { status: 404 });

    return Response.json(department);
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const department = await prisma.department.update({
      where: { id },
      data: parsed.data,
    });

    return Response.json(department);
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

    await prisma.department.delete({ where: { id } });

    return Response.json({ message: "Department deleted" });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
