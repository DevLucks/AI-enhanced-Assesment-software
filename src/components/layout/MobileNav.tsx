"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
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
  LogOut,
  X,
  Mail,
  ShieldCheck,
  Menu,
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
  const [showProfile, setShowProfile] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between bg-[#0F172A] px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
              <Brain size={14} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm font-heading">
              EduAssess
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-white/70 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500 border border-[#0F172A]" />
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold"
            aria-label="View profile"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Slide-in drawer */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-[#0F172A] shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm font-heading leading-tight">EduAssess</p>
              <p className="text-white/40 text-[11px] font-medium mt-0.5">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-white/40 hover:text-white transition-colors p-1"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-100",
                  "pl-2 pr-3 py-2.5",
                  active
                    ? "border-l-4 border-indigo-500 bg-white/10 text-white"
                    : "border-l-4 border-transparent text-slate-400 hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <span className={`shrink-0 ${active ? "text-indigo-400" : "text-slate-400"}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer user footer */}
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
            onClick={() => { setDrawerOpen(false); setShowConfirm(true); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] text-sm transition-all duration-100"
          >
            <LogOut size={15} className="shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Profile panel */}
      {showProfile && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold mb-3">
                {initials}
              </div>
              <p className="font-bold text-slate-900 text-lg font-heading leading-tight">
                {session?.user?.name ?? "User"}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
                <Mail size={13} />
                <span>{session?.user?.email ?? ""}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full">
                <ShieldCheck size={12} />
                <span>{roleLabel}</span>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => {
                setShowProfile(false);
                setShowConfirm(true);
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Sign-out confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <LogOut size={20} className="text-red-500" />
            </div>
            <h2 className="text-center font-bold font-heading text-slate-900 mb-1.5 text-lg">
              Sign out?
            </h2>
            <p className="text-center text-sm text-slate-500 mb-6">
              Are you sure you want to sign out? You&apos;ll be returned to the login screen.
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
