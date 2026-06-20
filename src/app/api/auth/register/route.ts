import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  idNumber: z.string().min(1),
  role: z.literal("STUDENT"),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const { name, email, idNumber, role, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          role === "STUDENT" ? { matricNumber: idNumber } : { staffId: idNumber },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Email or ID number already registered." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        ...(role === "STUDENT" ? { matricNumber: idNumber } : { staffId: idNumber }),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
