import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { GradeCircle } from "@/components/ui/Badge";
import {
  Clock,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
  FileText,
} from "lucide-react";

export default async function StudentAssessmentsPage() {
  const session = await auth();
  const studentId = session!.user.id;

  const [available, submitted] = await Promise.all([
    prisma.assessment.findMany({
      where: {
        status: { in: ["PUBLISHED", "ACTIVE"] },
        course: { students: { some: { id: studentId } } },
        submissions: { none: { studentId } },
      },
      include: { course: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { studentId },
      include: { assessment: { include: { course: true } }, result: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const statusVariant: Record<string, "success" | "info" | "neutral"> = {
    ACTIVE: "success",
    PUBLISHED: "info",
    CLOSED: "neutral",
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Header
        title="My Assessments"
        subtitle="All available and completed assessments"
      />
      <main className="flex-1 p-4 lg:p-8 space-y-8">
        {/* Available Assessments */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-slate-900 font-heading">
              Available
            </h2>
            {available.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {available.length}
              </span>
            )}
          </div>

          {available.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {available.map((a) => (
                <Link
                  key={a.id}
                  href={`/student/assessments/${a.id}`}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <ClipboardList size={20} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm leading-snug">
                        {a.title}
                      </p>
                      <Badge
                        variant={statusVariant[a.status] ?? "neutral"}
                      >
                        {a.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {a.course.name} · {a.course.code}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {a.duration} minutes
                      </span>
                      <span className="text-xs text-slate-400">
                        {a.totalMarks} marks
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                      <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                        Start Assessment <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <ClipboardList
                size={32}
                className="mx-auto mb-3 text-slate-200"
              />
              <p className="text-sm text-slate-400">
                No assessments available right now. Enroll in courses to see
                assessments.
              </p>
            </div>
          )}
        </section>

        {/* Submitted / Completed */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-slate-900 font-heading">
              Submitted
            </h2>
            {submitted.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                {submitted.length}
              </span>
            )}
          </div>

          {submitted.length > 0 ? (
            <div className="space-y-3">
              {submitted.map((s) => {
                const pct =
                  s.assessment.totalMarks > 0 && s.result
                    ? Math.round(
                        (s.result.totalMarks / s.assessment.totalMarks) * 100
                      )
                    : null;
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0 p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {s.assessment.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {s.assessment.course.name} · {s.assessment.course.code}
                      </p>
                      {s.submittedAt && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Submitted{" "}
                          {new Date(s.submittedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Score / Grade */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      {s.result ? (
                        <>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {s.result.totalMarks.toFixed(1)}
                              <span className="text-xs font-normal text-slate-400">
                                /{s.assessment.totalMarks}
                              </span>
                            </p>
                            {pct !== null && (
                              <p className="text-xs text-slate-400">{pct}%</p>
                            )}
                          </div>
                          <GradeCircle grade={s.result.grade} />
                        </>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">No submissions yet.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
