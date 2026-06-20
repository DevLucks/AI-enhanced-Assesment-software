import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import { GradeCircle } from "@/components/ui/Badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  ClipboardCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";

export default async function ReportsPage() {
  await auth();

  const [totalSubmissions, gradedSubmissions, results, topCourses] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "SUBMITTED" } }),
    prisma.result.findMany({
      include: {
        submission: {
          include: {
            student: true,
            assessment: { include: { course: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.course.findMany({
      include: { _count: { select: { assessments: true, students: true } } },
      take: 5,
      orderBy: { assessments: { _count: "desc" } },
    }),
  ]);

  const gradeDist: Record<string, number> = {};
  let totalMarks = 0;
  let passCount = 0;
  results.forEach((r) => {
    const g = r.grade[0];
    gradeDist[g] = (gradeDist[g] ?? 0) + 1;
    totalMarks += r.totalMarks;
    if (r.grade !== "F") passCount++;
  });
  const avgMark = results.length ? (totalMarks / results.length).toFixed(1) : "—";
  const passRate = results.length ? Math.round((passCount / results.length) * 100) : 0;

  const gradeColors: Record<string, string> = {
    A: "from-green-500 to-emerald-500",
    B: "from-indigo-500 to-blue-500",
    C: "from-amber-500 to-yellow-500",
    D: "from-orange-500 to-amber-500",
    F: "from-red-500 to-rose-500",
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Reports & Analytics" subtitle="Aggregated assessment performance data" />

      <main className="flex-1 p-4 lg:p-8 space-y-6 lg:space-y-8 bg-[#F8FAFC]">
        {/* Mobile heading */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-slate-900 font-heading">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Aggregated assessment performance data</p>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <StatCard
            label="Total Submissions"
            value={totalSubmissions}
            icon={<ClipboardCheck size={22} />}
            color="indigo"
          />
          <StatCard
            label="Avg Pass Rate"
            value={`${passRate}%`}
            icon={<BarChart3 size={22} />}
            color="green"
          />
          <StatCard
            label="AI Graded"
            value={gradedSubmissions}
            icon={<Zap size={22} />}
            color="violet"
          />
          <StatCard
            label="Avg Score"
            value={avgMark}
            icon={<TrendingUp size={22} />}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade Distribution */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900 font-heading">Grade Distribution</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {results.length} total results across all assessments
                </p>
              </div>
              <BarChart3 size={16} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              {["A", "B", "C", "D", "F"].map((g) => {
                const count = gradeDist[g] ?? 0;
                const pct = results.length ? Math.round((count / results.length) * 100) : 0;
                return (
                  <div key={g} className="flex items-center gap-3">
                    <GradeCircle grade={g} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-700">Grade {g}</span>
                        <span className="text-xs text-slate-500">
                          {count} student{count !== 1 ? "s" : ""} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 bg-gradient-to-r ${gradeColors[g] ?? "from-indigo-500 to-violet-500"} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {results.length === 0 && (
                <div className="flex flex-col items-center py-6 gap-2">
                  <BarChart3 size={24} className="text-slate-300" />
                  <p className="text-slate-400 text-sm">No results yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Courses by Activity */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900 font-heading">Course Performance</h2>
                <p className="text-xs text-slate-500 mt-0.5">Top courses by assessment activity</p>
              </div>
              <Users size={16} className="text-slate-400" />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                  <th className="pb-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Students</th>
                  <th className="pb-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Assessments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.code.replace(/[^A-Z]/g, "").slice(0, 2) || c.code.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm leading-tight">{c.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-slate-700">{c._count.students}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {c._count.assessments} active
                      </span>
                    </td>
                  </tr>
                ))}
                {topCourses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-slate-400 text-sm">
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Results Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 lg:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 font-heading">Recent Results</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest graded submissions across all courses</p>
            </div>
            <AlertTriangle size={16} className="text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Course</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {r.submission.student.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{r.submission.student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-[200px] truncate">
                      {r.submission.assessment.title}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                        {r.submission.assessment.course.code}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-700">
                      {r.totalMarks.toFixed(1)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-center">
                        <GradeCircle grade={r.grade} />
                      </div>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardCheck size={28} className="text-slate-300" />
                        <p className="text-slate-400 text-sm">No results yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
