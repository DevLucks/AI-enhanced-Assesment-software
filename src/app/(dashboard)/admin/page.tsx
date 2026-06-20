import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  Building2,
  UserPlus,
  LayoutDashboard,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  const [studentCount, lecturerCount, deptCount, courseCount, assessmentCount, recentAssessments] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "LECTURER" } }),
      prisma.department.count(),
      prisma.course.count(),
      prisma.assessment.count(),
      prisma.assessment.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { course: true, lecturer: true },
      }),
    ]);

  const statusVariant: Record<string, "success" | "warning" | "info" | "neutral" | "danger"> = {
    ACTIVE: "success",
    PUBLISHED: "info",
    DRAFT: "neutral",
    CLOSED: "danger",
  };

  const quickActions = [
    { href: "/admin/lecturers", icon: <UserPlus size={20} />, label: "Add Lecturer", color: "bg-indigo-50 text-indigo-600", hoverBorder: "hover:border-indigo-200" },
    { href: "/admin/students", icon: <GraduationCap size={20} />, label: "Add Student", color: "bg-violet-50 text-violet-600", hoverBorder: "hover:border-violet-200" },
    { href: "/admin/courses", icon: <BookOpen size={20} />, label: "Create Course", color: "bg-green-50 text-green-600", hoverBorder: "hover:border-green-200" },
    { href: "/admin/departments", icon: <Building2 size={20} />, label: "Create Dept", color: "bg-amber-50 text-amber-600", hoverBorder: "hover:border-amber-200" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Admin Dashboard" subtitle={`Welcome back, ${session?.user?.name ?? "Admin"}`} />

      <main className="flex-1 p-4 lg:p-8 space-y-6 lg:space-y-8 bg-[#F8FAFC]">
        {/* Mobile greeting */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-slate-900 font-heading">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, {session?.user?.name ?? "Admin"}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <StatCard
            label="Total Students"
            value={studentCount}
            icon={<GraduationCap size={22} />}
            color="indigo"
          />
          <StatCard
            label="Total Lecturers"
            value={lecturerCount}
            icon={<Users size={22} />}
            color="violet"
          />
          <StatCard
            label="Total Courses"
            value={courseCount}
            icon={<BookOpen size={22} />}
            color="green"
          />
          <StatCard
            label="Active Assessments"
            value={assessmentCount}
            icon={<ClipboardList size={22} />}
            color="amber"
          />
        </div>

        {/* Secondary stat row + Quick Actions in a 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Departments mini-card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-50 text-violet-600 flex-shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 font-heading">{deptCount}</p>
              <p className="text-sm text-slate-500">Departments</p>
            </div>
            <div className="ml-auto">
              <Link href="/admin/departments" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 font-heading mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-100 ${action.hoverBorder} hover:shadow-sm transition-all group`}
                >
                  <div className={`p-3 rounded-xl ${action.color} group-hover:scale-105 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Assessments Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 lg:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 font-heading">Recent Assessments</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest assessment activity across all courses</p>
            </div>
            <LayoutDashboard size={16} className="text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
                  <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Course</th>
                  <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lecturer</th>
                  <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 lg:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentAssessments.map((a: (typeof recentAssessments)[number], i) => (
                  <tr
                    key={a.id}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50/80 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <td className="px-5 lg:px-6 py-3.5 font-medium text-slate-900">{a.title}</td>
                    <td className="px-5 lg:px-6 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                        {a.course.code}
                      </span>
                    </td>
                    <td className="px-5 lg:px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {a.lecturer.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-slate-700 text-sm font-medium">{a.lecturer.name}</span>
                      </div>
                    </td>
                    <td className="px-5 lg:px-6 py-3.5">
                      <Badge variant={statusVariant[a.status] ?? "neutral"}>
                        {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-5 lg:px-6 py-3.5 text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
                {recentAssessments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList size={28} className="text-slate-300" />
                        <p className="text-slate-400 text-sm">No assessments yet. Create your first assessment to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="flex items-center justify-between rounded-xl bg-white border border-slate-100 shadow-sm px-5 lg:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-100" />
            <span className="text-sm font-medium text-slate-700">All modules operational</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp size={12} className="text-green-500" />
            <span className="font-mono">Server uptime: 99.9% (Last 30 days)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
