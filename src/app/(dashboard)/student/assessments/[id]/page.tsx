import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ExamClient from "./ExamClient";

interface Props { params: Promise<{ id: string }> }

export default async function TakeAssessmentPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const studentId = session!.user.id;

  const [assessment, existing] = await Promise.all([
    prisma.assessment.findUnique({
      where: { id },
      include: {
        course: true,
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { label: "asc" } } },
        },
      },
    }),
    prisma.submission.findUnique({
      where: { studentId_assessmentId: { studentId, assessmentId: id } },
    }),
  ]);

  if (!assessment) notFound();
  if (assessment.status !== "PUBLISHED" && assessment.status !== "ACTIVE") redirect("/student/assessments");
  if (existing?.status === "SUBMITTED") redirect("/student/results");

  // Start submission if not already started
  let submissionId = existing?.id;
  if (!submissionId) {
    const sub = await prisma.submission.create({
      data: { studentId, assessmentId: id },
    });
    submissionId = sub.id;
  }

  // Strip correct answers before sending to client
  const sanitized = assessment.questions.map((q) => ({
    ...q,
    modelAnswer: null,
    options: q.options.map((o) => ({ ...o, isCorrect: false })),
  }));

  return <ExamClient assessment={{ ...assessment, questions: sanitized }} submissionId={submissionId} />;
}
