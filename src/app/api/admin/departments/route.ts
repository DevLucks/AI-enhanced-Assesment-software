import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, courses: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(departments);
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
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: parsed.data,
    });

    return Response.json(department, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
