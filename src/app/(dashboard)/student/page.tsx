import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { GradeCircle } from "@/components/ui/Badge";
import {
  BookOpen,
  ClipboardList,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth();
  const studentId = session!.user.id;
  const studentName = session?.user?.name ?? "Student";

  const [enrolledCount, availableAssessments, submissions, results] =
    await Promise.all([
      prisma.course.count({ where: { students: { some: { id: studentId } } } }),
      prisma.assessment.findMany({
        where: {
          status: { in: ["PUBLISHED", "ACTIVE"] },
          course: { students: { some: { id: studentId } } },
          submissions: { none: { studentId } },
        },
        include: { course: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.submission.count({ where: { studentId } }),
      prisma.result.findMany({
        where: { submission: { studentId } },
        include: {
          submission: { include: { assessment: { include: { course: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const statusVariant: Record<string, "success" | "info" | "warning"> = {
    ACTIVE: "success",
    PUBLISHED: "info",
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Header
        title="Student Dashboard"
        subtitle={`Welcome back, ${studentName}`}
      />

      <main className="flex-1 p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading">
                Hello, {studentName.split(" ")[0]} 👋
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                {availableAssessments.length > 0
                  ? `You have ${availableAssessments.length} assessment${availableAssessments.length > 1 ? "s" : ""} available. Keep the momentum going!`
                  : "You're all caught up! Check back later for new assessments."}
              </p>
            </div>
            <Link
              href="/student/assessments"
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-white"
            >
              View Assessments <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Enrolled Courses"
            value={enrolledCount}
            icon={<BookOpen size={20} />}
            color="indigo"
          />
          <StatCard
            label="Available"
            value={availableAssessments.length}
            icon={<ClipboardList size={20} />}
            color="violet"
          />
          <StatCard
            label="Submitted"
            value={submissions}
            icon={<CheckCircle size={20} />}
            color="green"
          />
          <StatCard
            label="Results"
            value={results.length}
            icon={<FileText size={20} />}
            color="blue"
          />
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Assessments */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <ClipboardList size={15} />
                </div>
                <h2 className="font-bold text-slate-900 font-heading text-sm">
                  Available Assessments
                </h2>
                {availableAssessments.length > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                    {availableAssessments.length}
                  </span>
                )}
              </div>
              <Link
                href="/student/assessments"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            <div className="divide-y divide-slate-50">
              {availableAssessments.map((a) => (
                <Link
                  key={a.id}
                  href={`/student/assessments/${a.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 p-2 rounded-xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                      <ClipboardList size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{a.course.code}</span>
                        <span>·</span>
                        <Clock size={10} />
                        <span>{a.duration} min</span>
                        <span>·</span>
                        <span>{a.totalMarks} marks</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 ml-2">
                    <Badge variant={statusVariant[a.status] ?? "neutral"}>
                      {a.status}
                    </Badge>
                  </div>
                </Link>
              ))}
              {availableAssessments.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <ClipboardList
                    size={28}
                    className="mx-auto mb-2 text-slate-200"
                  />
                  <p className="text-sm text-slate-400">
                    No assessments available right now.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp size={15} />
                </div>
                <h2 className="font-bold text-slate-900 font-heading text-sm">
                  Recent Results
                </h2>
              </div>
              <Link
                href="/student/results"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            <div className="divide-y divide-slate-50">
              {results.map((r) => {
                const pct =
                  r.submission.assessment.totalMarks > 0
                    ? Math.round(
                        (r.totalMarks / r.submission.assessment.totalMarks) *
                          100
                      )
                    : 0;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <GradeCircle grade={r.grade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {r.submission.assessment.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.submission.assessment.course.code}
                      </p>
                      <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {r.totalMarks.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-400">{pct}%</p>
                    </div>
                  </div>
                );
              })}
              {results.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <FileText size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">No results yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
