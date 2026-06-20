import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]),
  departmentId: z.string().optional(),
  matricNumber: z.string().optional(),
  staffId: z.string().optional(),
});

const roleQuerySchema = z.enum(["ADMIN", "LECTURER", "STUDENT"]).optional();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role") ?? undefined;
    const parsed = roleQuerySchema.safeParse(roleParam);

    if (roleParam && !parsed.success) {
      return Response.json({ error: "Invalid role filter" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: parsed.data ? { role: parsed.data } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricNumber: true,
        staffId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { name: true } },
        _count: { select: { taughtCourses: true, submissions: true } },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(users);
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
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { password, ...rest } = parsed.data;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { ...rest, password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricNumber: true,
        staffId: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const field = (error.meta?.target as string[] | undefined)?.[0] ?? "field";
        const label = field === "email" ? "Email address" : field === "staffId" ? "Staff ID" : field === "matricNumber" ? "Matric number" : field;
        return Response.json({ error: `${label} is already in use.` }, { status: 409 });
      }
      if (error.code === "P2003") {
        return Response.json({ error: "Invalid department selected." }, { status: 400 });
      }
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
