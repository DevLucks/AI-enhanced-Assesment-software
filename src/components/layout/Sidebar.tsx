"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  ClipboardList,
  FileText,
  UserCircle,
  Bell,
  LogOut,
  Brain,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={18} /> },
  {
    label: "Departments",
    href: "/admin/departments",
    icon: <Building2 size={18} />,
  },
  { label: "Lecturers", href: "/admin/lecturers", icon: <Users size={18} /> },
  {
    label: "Students",
    href: "/admin/students",
    icon: <GraduationCap size={18} />,
  },
  { label: "Courses", href: "/admin/courses", icon: <BookOpen size={18} /> },
  { label: "Reports", href: "/admin/reports", icon: <BarChart3 size={18} /> },
];

const lecturerNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/lecturer",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Assessments",
    href: "/lecturer/assessments",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Profile",
    href: "/lecturer/profile",
    icon: <UserCircle size={18} />,
  },
];

const studentNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/student",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "My Courses",
    href: "/student/courses",
    icon: <BookOpen size={18} />,
  },
  {
    label: "Assessments",
    href: "/student/assessments",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Results",
    href: "/student/results",
    icon: <FileText size={18} />,
  },
  {
    label: "Notifications",
    href: "/student/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Profile",
    href: "/student/profile",
    icon: <UserCircle size={18} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [showConfirm, setShowConfirm] = useState(false);

  const nav =
    role === "ADMIN"
      ? adminNav
      : role === "LECTURER"
        ? lecturerNav
        : studentNav;

  const roleLabel =
    role === "ADMIN"
      ? "Administrator"
      : role === "LECTURER"
        ? "Lecturer"
        : "Student";

  const isActive = (href: string) =>
    href === "/admin" || href === "/lecturer" || href === "/student"
      ? pathname === href
      : pathname.startsWith(href);

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  return (
    <>
      {/* Sidebar panel — desktop only */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 h-full w-[280px] flex-col bg-[#0F172A]">
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm font-heading leading-tight">
              EduAssess
            </p>
            <p className="text-white/40 text-[11px] font-medium mt-0.5">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* ── Nav items ── */}
        <nav
          className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4 space-y-0.5"
          aria-label="Main navigation"
        >
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-100",
                  "pl-2 pr-3 py-2.5",
                  active
                    ? "border-l-4 border-indigo-500 bg-white/10 text-white"
                    : "border-l-4 border-transparent text-slate-400 hover:bg-white/5 hover:text-white",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className={`shrink-0 ${active ? "text-indigo-400" : "text-slate-400"}`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── User footer ── */}
        <div className="shrink-0 border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 mb-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-white/40 text-[11px] truncate mt-0.5">
                {session?.user?.email ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] text-sm transition-all duration-100"
          >
            <LogOut size={15} className="shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Sign-out confirmation modal ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            {/* Close */}
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <LogOut size={20} className="text-red-500" />
            </div>

            <h2
              id="signout-title"
              className="text-center font-bold font-heading text-slate-900 mb-1.5 text-lg"
            >
              Sign out?
            </h2>
            <p className="text-center text-sm text-slate-500 mb-6">
              Are you sure you want to sign out? You&apos;ll be returned to the
              login screen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
