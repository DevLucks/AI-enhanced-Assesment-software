import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { GradeCircle } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/Card";
import { FileText, TrendingUp, Award, BarChart2, ClipboardList } from "lucide-react";

export default async function StudentResultsPage() {
  const session = await auth();
  const studentId = session!.user.id;

  const results = await prisma.result.findMany({
    where: { submission: { studentId } },
    include: {
      submission: {
        include: {
          assessment: { include: { course: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const avgScore =
    results.length
      ? (
          results.reduce((acc, r) => acc + r.totalMarks, 0) / results.length
        ).toFixed(1)
      : "—";

  const bestGrade = results.reduce<string | null>((best, r) => {
    const order = ["A", "B", "C", "D", "F"];
    const letter = r.grade?.[0] ?? "F";
    if (!best) return letter;
    return order.indexOf(letter) < order.indexOf(best) ? letter : best;
  }, null);

  const avgPct =
    results.length
      ? Math.round(
          results.reduce((acc, r) => {
            const total = r.submission.assessment.totalMarks;
            return acc + (total > 0 ? (r.totalMarks / total) * 100 : 0);
          }, 0) / results.length
        )
      : 0;

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Header
        title="My Results"
        subtitle="View all your assessment grades and feedback"
      />
      <main className="flex-1 p-4 lg:p-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Results"
            value={results.length}
            icon={<FileText size={20} />}
            color="indigo"
          />
          <StatCard
            label="Average Score"
            value={avgScore}
            icon={<TrendingUp size={20} />}
            color="violet"
          />
          <StatCard
            label="Best Grade"
            value={bestGrade ?? "—"}
            icon={<Award size={20} />}
            color="green"
          />
          <StatCard
            label="Avg Percentage"
            value={results.length ? `${avgPct}%` : "—"}
            icon={<BarChart2 size={20} />}
            color="blue"
          />
        </div>

        {/* Results list */}
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-14 text-center">
            <FileText size={36} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 text-sm">
              No results yet. Complete an assessment to see your grade here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r) => {
              const assessment = r.submission.assessment;
              const pct =
                assessment.totalMarks > 0
                  ? Math.round((r.totalMarks / assessment.totalMarks) * 100)
                  : 0;

              const gradeColor: Record<string, string> = {
                A: "from-emerald-500 to-emerald-400",
                B: "from-blue-500 to-blue-400",
                C: "from-amber-500 to-amber-400",
                D: "from-orange-500 to-orange-400",
                F: "from-red-500 to-red-400",
              };
              const barColor =
                gradeColor[r.grade?.[0] ?? "F"] ??
                "from-indigo-500 to-violet-500";

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 font-heading truncate">
                        {assessment.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {assessment.course.name} · {assessment.course.code}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 font-heading">
                          {r.totalMarks.toFixed(1)}
                          <span className="text-sm font-normal text-slate-400">
                            /{assessment.totalMarks}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {pct}%
                        </p>
                      </div>
                      <GradeCircle grade={r.grade} />
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Objective (MCQ)
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {r.objectiveMarks.toFixed(1)} marks
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Subjective (AI Graded)
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {r.subjectiveMarks.toFixed(1)} marks
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Score</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Review link */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link
                      href={`/student/results/${r.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <ClipboardList size={15} />
                      Review Answers
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
