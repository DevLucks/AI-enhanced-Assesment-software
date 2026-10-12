import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ExamClient from "./ExamClient";
import Header from "@/components/layout/Header";
import { Clock, ArrowLeft } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

function formatDateTime(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  // A student can only start a NEW attempt within the lecturer's scheduled window.
  // Once started, the countdown timer (not endTime) governs how long they have left.
  if (!existing) {
    const now = new Date();
    if (assessment.startTime && now < assessment.startTime) {
      return (
        <NoticeScreen
          assessment={assessment}
          message={`This assessment isn't open yet. It becomes available on ${formatDateTime(assessment.startTime)}.`}
        />
      );
    }
    if (assessment.endTime && now > assessment.endTime) {
      return (
        <NoticeScreen
          assessment={assessment}
          message={`This assessment's window closed on ${formatDateTime(assessment.endTime)}.`}
        />
      );
    }
  }

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

function NoticeScreen({
  assessment,
  message,
}: {
  assessment: { title: string; course: { name: string; code: string } };
  message: string;
}) {
  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Header title={assessment.title} subtitle={`${assessment.course.code} · ${assessment.course.name}`} />
      <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 max-w-md text-center">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock size={22} />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          <Link
            href="/student/assessments"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Assessments
          </Link>
        </div>
      </main>
    </div>
  );
}
