import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/Card";
import { Plus, Eye, Star, ClipboardList, Users, CheckCircle } from "lucide-react";

export default async function LecturerAssessmentsPage() {
  const session = await auth();
  const lecturerId = session!.user.id;

  const assessments = await prisma.assessment.findMany({
    where: { lecturerId },
    include: {
      course: true,
      _count: { select: { submissions: true, questions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSubmissions = assessments.reduce((acc, a) => acc + a._count.submissions, 0);
  const activeCount = assessments.filter((a) => a.status === "ACTIVE").length;
  const closedCount = assessments.filter((a) => a.status === "CLOSED").length;

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
    <div className="flex flex-col flex-1 bg-slate-50">
      <Header
        title="My Assessments"
        subtitle="Manage and monitor all your assessments"
      />

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Total Assessments"
            value={assessments.length}
            icon={<ClipboardList size={20} />}
            color="indigo"
            sub={`${activeCount} active`}
          />
          <StatCard
            label="Total Submissions"
            value={totalSubmissions}
            icon={<Users size={20} />}
            color="violet"
          />
          <StatCard
            label="Pending Review"
            value={closedCount}
            icon={<CheckCircle size={20} />}
            color="amber"
            sub="closed assessments"
          />
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">All Assessments</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <Link href="/lecturer/assessments/create">
              <Button size="sm">
                <Plus size={15} />
                Create Assessment
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
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
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
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {a.title}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 rounded px-2 py-0.5 w-fit">
                          {a.course.code}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">
                          {a.course.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="font-semibold text-slate-700">{a._count.questions}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="font-semibold text-slate-700">{a._count.submissions}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {a.duration} min
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusVariant[a.status] ?? "neutral"}>
                        {statusLabel[a.status] ?? a.status}
                      </Badge>
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
                              <Star size={13} />
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
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                          <ClipboardList size={22} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium text-sm">No assessments found</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            Create your first assessment to get started
                          </p>
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
