import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  ClipboardList,
  BookOpen,
  Users,
  Plus,
  Eye,
  BarChart2,
  TrendingUp,
} from "lucide-react";

export default async function LecturerDashboard() {
  const session = await auth();
  const lecturerId = session!.user.id;

  const [assessments, courseCount, submissionCount, gradedCount] = await Promise.all([
    prisma.assessment.findMany({
      where: { lecturerId },
      include: {
        course: true,
        _count: { select: { submissions: true, questions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.course.count({ where: { lecturers: { some: { id: lecturerId } } } }),
    prisma.submission.count({ where: { assessment: { lecturerId } } }),
    prisma.submission.count({
      where: { assessment: { lecturerId }, result: { isNot: null } },
    }),
  ]);

  const statusVariant: Record<string, "success" | "warning" | "info" | "neutral"> = {
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

  const activeCount = assessments.filter((a) => a.status === "ACTIVE").length;

  return (
    <div className="flex flex-col flex-1 bg-slate-50">
      <Header
        title="Lecturer Dashboard"
        subtitle={`Welcome back, ${session?.user?.name ?? "Lecturer"}`}
      />

      <main className="flex-1 p-6 lg:p-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="My Assessments"
            value={assessments.length}
            icon={<ClipboardList size={20} />}
            color="indigo"
            sub={`${activeCount} currently active`}
          />
          <StatCard
            label="My Courses"
            value={courseCount}
            icon={<BookOpen size={20} />}
            color="violet"
          />
          <StatCard
            label="Total Submissions"
            value={submissionCount}
            icon={<Users size={20} />}
            color="green"
          />
          <StatCard
            label="Graded"
            value={gradedCount}
            icon={<BarChart2 size={20} />}
            color="amber"
            sub={submissionCount > 0 ? `${Math.round((gradedCount / submissionCount) * 100)}% graded` : "—"}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/lecturer/assessments/create">
            <Button size="sm">
              <Plus size={15} />
              Create Assessment
            </Button>
          </Link>
          <Link href="/lecturer/assessments">
            <Button size="sm" variant="secondary">
              <ClipboardList size={15} />
              View All Assessments
            </Button>
          </Link>
        </div>

        {/* Recent Assessments Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Recent Assessments</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your most recent assessments</p>
            </div>
            <Link href="/lecturer/assessments">
              <Button size="sm" variant="ghost">
                <TrendingUp size={14} />
                View All
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assessments.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                      {a.title}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                        {a.course.code}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusVariant[a.status] ?? "neutral"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-center text-slate-500">
                      {a._count.questions}
                    </td>
                    <td className="px-6 py-3.5 text-center text-slate-500">
                      {a._count.submissions}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/lecturer/assessments/${a.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye size={13} />
                            View
                          </Button>
                        </Link>
                        {a.status === "CLOSED" && (
                          <Link href={`/lecturer/assessments/${a.id}/grade`}>
                            <Button size="sm" variant="secondary">
                              Grade
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                          <ClipboardList size={22} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium text-sm">No assessments yet</p>
                          <p className="text-slate-400 text-xs mt-0.5">Create your first assessment to get started</p>
                        </div>
                        <Link href="/lecturer/assessments/create">
                          <Button size="sm">
                            <Plus size={14} />
                            Create Assessment
                          </Button>
                        </Link>
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
