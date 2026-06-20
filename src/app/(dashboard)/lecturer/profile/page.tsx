import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import UpdateProfileForm from "./UpdateProfileForm";
import { Users, BookOpen, Hash } from "lucide-react";

export default async function LecturerProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: {
      department: true,
      taughtCourses: {
        include: { _count: { select: { students: true } } },
      },
    },
  });

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-screen">
      <Header title="My Profile" subtitle="Manage your account and settings" />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Profile Hero Card */}
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg shadow-indigo-200">
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <Badge variant="primary">Lecturer</Badge>
                  {user.department && (
                    <Badge variant="info">{user.department.name}</Badge>
                  )}
                  <Badge variant="neutral">
                    {user.taughtCourses.length} Courses
                  </Badge>
                </div>
              </div>
            </div>

            {/* Extra metadata row */}
            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {user.staffId && (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Hash size={14} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Staff ID</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">
                      {user.staffId}
                    </p>
                  </div>
                </div>
              )}
              {user.department && (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={14} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Department</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {user.department.name}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Users size={14} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Students</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {user.taughtCourses.reduce(
                      (sum, c) => sum + c._count.students,
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Edit Profile Form */}
          <UpdateProfileForm
            userId={user.id}
            name={user.name}
            email={user.email}
          />

          {/* Assigned Courses */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Assigned Courses</h3>
              <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-1 font-semibold">
                {user.taughtCourses.length}
              </span>
            </div>

            {user.taughtCourses.length > 0 ? (
              <div className="space-y-2">
                {user.taughtCourses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <BookOpen size={14} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {c.name}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          {c.code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-700">
                        {c._count.students}
                      </p>
                      <p className="text-xs text-slate-400">students</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <BookOpen size={18} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No courses assigned yet.</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Contact an administrator to be assigned to courses.
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
