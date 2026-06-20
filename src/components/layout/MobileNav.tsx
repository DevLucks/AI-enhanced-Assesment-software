"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Bell,
  UserCircle,
  Building2,
  Users,
  BookOpen,
  BarChart3,
  Brain,
} from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Users", href: "/admin/lecturers", icon: Users },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

const lecturerNav = [
  { label: "Dashboard", href: "/lecturer", icon: LayoutDashboard },
  { label: "Assessments", href: "/lecturer/assessments", icon: ClipboardList },
  { label: "Profile", href: "/lecturer/profile", icon: UserCircle },
];

const studentNav = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Courses", href: "/student/courses", icon: BookOpen },
  { label: "Exams", href: "/student/assessments", icon: ClipboardList },
  { label: "Results", href: "/student/results", icon: FileText },
  { label: "Profile", href: "/student/profile", icon: UserCircle },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const nav =
    role === "ADMIN"
      ? adminNav
      : role === "LECTURER"
        ? lecturerNav
        : studentNav;

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const isActive = (href: string) =>
    href === "/admin" || href === "/lecturer" || href === "/student"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between bg-[#0F172A] px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm font-heading">
            EduAssess
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-white/70 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500 border border-[#0F172A]" />
          </button>
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
            {initials}
          </div>
        </div>
      </header>

      {/* Bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex h-16 items-stretch bg-white border-t border-slate-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wide transition-colors ${
                active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
