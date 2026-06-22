"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import {
  BookOpen,
  CheckCircle,
  PlusCircle,
  Users,
  ClipboardList,
  Search,
  X,
} from "lucide-react";
import { CardGridSkeleton } from "@/components/ui/Skeleton";

interface Course {
  id: string;
  name: string;
  code: string;
  enrolled: boolean;
  department: { name: string };
  lecturers: { name: string }[];
  _count: { students: number; assessments: number };
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/student/courses");
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleEnroll(course: Course) {
    setToggling(course.id);
    // Optimistic update
    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id
          ? {
              ...c,
              enrolled: !c.enrolled,
              _count: {
                ...c._count,
                students: c._count.students + (course.enrolled ? -1 : 1),
              },
            }
          : c
      )
    );
    try {
      const method = course.enrolled ? "DELETE" : "POST";
      await fetch(`/api/student/courses/${course.id}/enroll`, { method });
    } catch {
      // Revert on error
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id
            ? {
                ...c,
                enrolled: course.enrolled,
                _count: { ...c._count, students: course._count.students },
              }
            : c
        )
      );
    } finally {
      setToggling(null);
    }
  }

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.department.name.toLowerCase().includes(search.toLowerCase())
  );

  const enrolled = filtered.filter((c) => c.enrolled);
  const available = filtered.filter((c) => !c.enrolled);

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      <Header title="My Courses" subtitle="Browse and manage your course enrolments" />
      <main className="flex-1 p-4 lg:p-8 space-y-8">
        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : (
          <>
            {/* My Courses */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-bold font-heading text-slate-800">
                  My Courses
                </h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  {enrolled.length}
                </span>
              </div>

              {enrolled.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                  <BookOpen
                    size={32}
                    className="mx-auto mb-3 text-slate-200"
                  />
                  <p className="text-sm text-slate-400">
                    {search
                      ? "No enrolled courses match your search."
                      : "You haven’t enrolled in any courses yet. Browse below to get started."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolled.map((c) => (
                    <CourseCard
                      key={c.id}
                      course={c}
                      toggling={toggling === c.id}
                      onToggle={() => toggleEnroll(c)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Available Courses */}
            {(available.length > 0 || search) && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-bold font-heading text-slate-800">
                    Available Courses
                  </h2>
                  <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                    {available.length}
                  </span>
                </div>

                {available.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                    <p className="text-sm text-slate-400">
                      No available courses match your search.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {available.map((c) => (
                      <CourseCard
                        key={c.id}
                        course={c}
                        toggling={toggling === c.id}
                        onToggle={() => toggleEnroll(c)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {courses.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  No courses are available yet. Check back later.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CourseCard({
  course,
  toggling,
  onToggle,
}: {
  course: Course;
  toggling: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-all hover:shadow-md ${
        course.enrolled ? "border-indigo-200" : "border-slate-100"
      }`}
    >
      {/* Top: icon + name + enrolled check */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex-shrink-0 p-2.5 rounded-xl ${
              course.enrolled
                ? "bg-indigo-50 text-indigo-600"
                : "bg-violet-50 text-violet-600"
            }`}
          >
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-tight truncate">
              {course.name}
            </p>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {course.code}
            </p>
          </div>
        </div>
        {course.enrolled && (
          <CheckCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Department badge + lecturer */}
      <div className="flex flex-col gap-1.5 items-start">
        <Badge variant="primary">{course.department.name}</Badge>
        {course.lecturers.length > 0 && (
          <p className="text-xs text-slate-500 truncate">
            {course.lecturers.map((l) => l.name).join(", ")}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={11} /> {course._count.students} students
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList size={11} /> {course._count.assessments} assessments
        </span>
      </div>

      {/* Action button */}
      <button
        onClick={onToggle}
        disabled={toggling}
        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
          course.enrolled
            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
        }`}
      >
        {toggling ? (
          "Saving…"
        ) : course.enrolled ? (
          <>
            <X size={13} /> Unenroll
          </>
        ) : (
          <>
            <PlusCircle size={13} /> Enroll Now
          </>
        )}
      </button>
    </div>
  );
}
