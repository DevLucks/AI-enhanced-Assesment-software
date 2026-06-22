import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import GradeReviewPanel from "./GradeReviewPanel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AIGradingPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      course: true,
      questions: { orderBy: { order: "asc" } },
      submissions: {
        where: { status: "SUBMITTED" },
        include: {
          student: { select: { name: true, matricNumber: true } },
          result: true,
          answers: {
            include: {
              question: {
                include: { options: { select: { id: true, label: true, text: true, isCorrect: true } } },
              },
            },
            orderBy: { question: { order: "asc" } },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assessment || assessment.lecturerId !== session!.user.id) notFound();

  return (
    <div className="flex flex-col flex-1 bg-slate-50" style={{ height: "100dvh" }}>
      <Header
        title="AI Grading Review"
        subtitle={`${assessment.title} · ${assessment.course.code} — review and override AI grades`}
      />
      <main className="flex-1 flex overflow-hidden">
        <GradeReviewPanel assessment={assessment} />
      </main>
    </div>
  );
}
