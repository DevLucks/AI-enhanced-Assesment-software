import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]).optional(),
  departmentId: z.string().nullable().optional(),
  matricNumber: z.string().nullable().optional(),
  staffId: z.string().nullable().optional(),
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  matricNumber: true,
  staffId: true,
  departmentId: true,
  createdAt: true,
  updatedAt: true,
  department: true,
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json(user);
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
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };

    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return Response.json(user);
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

    await prisma.user.delete({ where: { id } });

    return Response.json({ message: "User deleted" });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
