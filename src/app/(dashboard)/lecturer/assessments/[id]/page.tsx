import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { GradeCircle } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PublishButton from "./PublishButton";
import {
  Clock,
  BookOpen,
  HelpCircle,
  Users,
  Star,
  ChevronRight,
  FileText,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssessmentResultsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      course: true,
      questions: { orderBy: { order: "asc" } },
      submissions: {
        include: {
          student: { select: { name: true, matricNumber: true } },
          result: true,
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assessment || assessment.lecturerId !== session!.user.id) notFound();

  const submitted = assessment.submissions.filter(
    (s) => s.status === "SUBMITTED"
  );
  const graded = submitted.filter((s) => s.result);

  const statusVariant: Record<string, "success" | "info" | "neutral" | "warning"> = {
    ACTIVE: "success",
    PUBLISHED: "info",
    DRAFT: "neutral",
    CLOSED: "warning",
  };

  const statusLabel: Record<string, string> = {
    ACTIVE: "Active",
    PUBLISHED: "Published",
    DRAFT: "Draft",
    CLOSED: "Closed",
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-screen">
      <Header
        title={assessment.title}
        subtitle={`${assessment.course.code} · ${assessment.course.name}`}
      />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {/* Assessment Info + Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            {/* Left: meta */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusVariant[assessment.status] ?? "neutral"}>
                {statusLabel[assessment.status] ?? assessment.status}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Clock size={14} />
                <span>{assessment.duration} min</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <FileText size={14} />
                <span>{assessment.totalMarks} marks</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <HelpCircle size={14} />
                <span>{assessment.questions.length} questions</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Users size={14} />
                <span>
                  {submitted.length} submitted · {graded.length} graded
                </span>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2">
              {assessment.status === "CLOSED" && graded.length > 0 && (
                <Link href={`/lecturer/assessments/${id}/grade`}>
                  <Button size="sm" variant="secondary">
                    <Star size={14} />
                    AI Grading Review
                  </Button>
                </Link>
              )}
              <PublishButton
                assessmentId={id}
                currentStatus={assessment.status}
              />
            </div>
          </div>

          {assessment.description && (
            <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
              {assessment.description}
            </p>
          )}
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Questions",
              value: assessment.questions.length,
              icon: <HelpCircle size={16} />,
              color: "text-indigo-600 bg-indigo-50",
            },
            {
              label: "Submissions",
              value: submitted.length,
              icon: <Users size={16} />,
              color: "text-violet-600 bg-violet-50",
            },
            {
              label: "Graded",
              value: graded.length,
              icon: <Star size={16} />,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Total Marks",
              value: assessment.totalMarks,
              icon: <FileText size={16} />,
              color: "text-blue-600 bg-blue-50",
            },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                {icon}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 leading-tight">
                  {value}
                </p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Questions List */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">
              Questions ({assessment.questions.length})
            </h2>
          </div>
          {assessment.questions.length > 0 ? (
            <div className="space-y-2">
              {assessment.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 line-clamp-2">{q.text}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={q.type === "OBJECTIVE" ? "info" : "primary"}>
                      {q.type === "OBJECTIVE" ? "MCQ" : "Essay"}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {q.marks} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">
              No questions added yet.
            </p>
          )}
        </Card>

        {/* Submissions Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Submissions</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {submitted.length} of {assessment.submissions.length} submitted
              </p>
            </div>
            {assessment.status === "CLOSED" && graded.length > 0 && (
              <Link href={`/lecturer/assessments/${id}/grade`}>
                <Button size="sm" variant="secondary">
                  <Star size={13} />
                  Review Grades
                  <ChevronRight size={13} />
                </Button>
              </Link>
            )}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Matric No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assessment.submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-900">
                    {s.student.name}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">
                    {s.student.matricNumber ?? "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      variant={
                        s.status === "SUBMITTED" ? "success" : "warning"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-slate-700">
                    {s.result
                      ? `${s.result.totalMarks.toFixed(1)} / ${assessment.totalMarks}`
                      : "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-center">
                      {s.result ? (
                        <GradeCircle grade={s.result.grade} />
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {assessment.submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
