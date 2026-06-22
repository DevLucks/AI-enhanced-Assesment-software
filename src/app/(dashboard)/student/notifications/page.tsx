import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import { Bell, ClipboardList, CheckCircle, BookOpen } from "lucide-react";

export default async function NotificationsPage() {
  const session = await auth();
  const studentId = session!.user.id;

  const [available, recentResults, enrolledCourses] = await Promise.all([
    prisma.assessment.findMany({
      where: {
        status: { in: ["PUBLISHED", "ACTIVE"] },
        course: { students: { some: { id: studentId } } },
        submissions: { none: { studentId } },
      },
      include: { course: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.result.findMany({
      where: { submission: { studentId } },
      include: {
        submission: { include: { assessment: { include: { course: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.course.findMany({
      where: { students: { some: { id: studentId } } },
      take: 5,
    }),
  ]);

  type NotifType = "assessment" | "result" | "course";

  const notifications: {
    id: string;
    type: NotifType;
    title: string;
    body: string;
    date: Date;
    href: string;
  }[] = [
    ...available.map((a) => ({
      id: `a-${a.id}`,
      type: "assessment" as NotifType,
      title: `New assessment available: ${a.title}`,
      body: `${a.course.name} · ${a.course.code} · ${a.duration} min · ${a.totalMarks} marks`,
      date: a.createdAt,
      href: `/student/assessments/${a.id}`,
    })),
    ...recentResults.map((r) => ({
      id: `r-${r.id}`,
      type: "result" as NotifType,
      title: `Result published: ${r.submission.assessment.title}`,
      body: `${r.submission.assessment.course.code} · Grade: ${r.grade} · Score: ${r.totalMarks.toFixed(1)}`,
      date: r.createdAt,
      href: `/student/results`,
    })),
    ...enrolledCourses.map((c) => ({
      id: `c-${c.id}`,
      type: "course" as NotifType,
      title: `Enrolled in ${c.name}`,
      body: `Course code: ${c.code}`,
      date: new Date(0), // Course has no createdAt; sort last
      href: `/student/courses`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const iconConfig: Record<
    NotifType,
    { bg: string; text: string; icon: React.ReactNode }
  > = {
    assessment: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      icon: <ClipboardList size={18} />,
    },
    result: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      icon: <CheckCircle size={18} />,
    },
    course: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      icon: <BookOpen size={18} />,
    },
  };

  const badgeVariant: Record<NotifType, "primary" | "success" | "info"> = {
    assessment: "primary",
    result: "success",
    course: "info",
  };

  const badgeLabel: Record<NotifType, string> = {
    assessment: "New",
    result: "Graded",
    course: "Enrolled",
  };

  function timeAgo(date: Date): string {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Header
        title="Notifications"
        subtitle="Assessment updates and result announcements"
      />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Count row */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">
                  {notifications.length}
                </span>{" "}
                notification{notifications.length !== 1 ? "s" : ""}
              </p>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
                {available.length} unread
              </span>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-14 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-slate-300" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">
                You&apos;re all caught up!
              </h3>
              <p className="text-sm text-slate-400">
                No notifications yet. Enroll in courses to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const cfg = iconConfig[n.type];
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4 hover:border-indigo-200 hover:shadow-md transition-all group"
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 p-2.5 rounded-xl ${cfg.bg} ${cfg.text}`}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {n.body}
                      </p>
                      <p className="text-xs text-slate-300 mt-1.5">
                        {timeAgo(n.date)}
                      </p>
                    </div>

                    {/* Badge */}
                    <div className="flex-shrink-0 mt-0.5">
                      <Badge variant={badgeVariant[n.type]}>
                        {badgeLabel[n.type]}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
