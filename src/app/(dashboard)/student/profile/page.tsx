import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import StudentProfileForm from "./StudentProfileForm";
import { BookOpen, Mail, Hash, GraduationCap } from "lucide-react";

export default async function StudentProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: { department: true, enrolledCourses: true },
  });
  if (!user) return null;

  // Avatar initials (up to 2 characters)
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC] min-h-screen">
      <Header title="My Profile" subtitle="Manage your account settings" />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Identity card */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {initials}
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 font-heading">
                  {user.name}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="info">Student</Badge>
                  {user.department && (
                    <Badge variant="primary">{user.department.name}</Badge>
                  )}
                  {user.role && (
                    <Badge variant="neutral">{user.role}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                  <Mail size={15} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Email</p>
                  <p className="text-sm text-slate-700 font-medium truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {user.matricNumber && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                    <Hash size={15} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Matric Number
                    </p>
                    <p className="text-sm font-mono font-semibold text-slate-700">
                      {user.matricNumber}
                    </p>
                  </div>
                </div>
              )}

              {user.department && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                    <GraduationCap size={15} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Department
                    </p>
                    <p className="text-sm text-slate-700 font-medium">
                      {user.department.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Edit form */}
          <StudentProfileForm
            userId={user.id}
            name={user.name}
            email={user.email}
          />

          {/* Enrolled Courses */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen size={15} />
              </div>
              <h3 className="font-bold text-slate-900 font-heading">
                Enrolled Courses
              </h3>
              {user.enrolledCourses.length > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  {user.enrolledCourses.length}
                </span>
              )}
            </div>

            {user.enrolledCourses.length > 0 ? (
              <div className="space-y-2">
                {user.enrolledCourses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <span className="text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg flex-shrink-0">
                      {c.code}
                    </span>
                    <span className="text-sm text-slate-700 font-medium truncate">
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen
                  size={28}
                  className="mx-auto mb-2 text-slate-200"
                />
                <p className="text-sm text-slate-400">
                  No courses enrolled yet.
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
