import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [adminHash, lecturerHash, studentHash] = await Promise.all([
    bcrypt.hash("admin123", 12),
    bcrypt.hash("lecturer123", 12),
    bcrypt.hash("student123", 12),
  ]);

  // Department
  const dept = await prisma.department.upsert({
    where: { code: "CPE" },
    update: {},
    create: { name: "Computer Engineering", code: "CPE" },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@eduassess.com" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@eduassess.com",
      password: adminHash,
      role: Role.ADMIN,
      departmentId: dept.id,
    },
  });

  // Lecturer
  const lecturer = await prisma.user.upsert({
    where: { email: "lecturer@eduassess.com" },
    update: {},
    create: {
      name: "Dr. James Okafor",
      email: "lecturer@eduassess.com",
      password: lecturerHash,
      role: Role.LECTURER,
      staffId: "STAFF-001",
      departmentId: dept.id,
    },
  });

  // Student
  const student = await prisma.user.upsert({
    where: { email: "student@eduassess.com" },
    update: {},
    create: {
      name: "Amara Nwosu",
      email: "student@eduassess.com",
      password: studentHash,
      role: Role.STUDENT,
      matricNumber: "CPE/2021/001",
      departmentId: dept.id,
    },
  });

  // Course — linked to lecturer and student
  const course = await prisma.course.upsert({
    where: { code: "CPE401" },
    update: {},
    create: {
      name: "Introduction to Artificial Intelligence",
      code: "CPE401",
      departmentId: dept.id,
    },
  });

  // Enroll both in the course
  await prisma.course.update({
    where: { id: course.id },
    data: {
      lecturers: { connect: { id: lecturer.id } },
      students: { connect: { id: student.id } },
    },
  });

  console.log("\n✓ Seed complete. Test accounts:\n");
  console.log("  ADMIN     → admin@eduassess.com     / admin123");
  console.log("  LECTURER  → lecturer@eduassess.com  / lecturer123");
  console.log("  STUDENT   → student@eduassess.com   / student123\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
