"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/Card";
import { CardGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  BookOpen,
  Users,
  AlertCircle,
  ClipboardList,
  GraduationCap,
  UserCheck,
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  department: { name: string };
  lecturers?: { id: string; name: string; email: string }[];
  _count: { assessments: number; students: number };
}
interface Dept { id: string; name: string }
interface UserOption {
  id: string;
  name: string;
  email: string;
  staffId?: string | null;
  matricNumber?: string | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);

  // create/edit modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ name: "", code: "", departmentId: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // enrollment modal
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
  const [allStudents, setAllStudents] = useState<UserOption[]>([]);
  const [allLecturers, setAllLecturers] = useState<UserOption[]>([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<Set<string>>(new Set());
  const [enrolledLecturerIds, setEnrolledLecturerIds] = useState<Set<string>>(new Set());
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSaving, setEnrollSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        fetch("/api/admin/courses"),
        fetch("/api/admin/departments"),
      ]);
      const cData = await cRes.json();
      const dData = await dRes.json();
      setCourses(Array.isArray(cData) ? cData : []);
      setDepts(Array.isArray(dData) ? dData : []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", code: "", departmentId: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({ name: c.name, code: c.code, departmentId: c.departmentId });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const url = editing ? `/api/admin/courses/${editing.id}` : "/api/admin/courses";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          departmentId: form.departmentId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Failed to save. Please try again.");
        return;
      }
      setShowForm(false);
      await load();
    } catch {
      setFormError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  }

  async function openEnroll(c: Course) {
    setEnrollCourse(c);
    setEnrollLoading(true);
    try {
      const [courseRes, studRes, lectRes] = await Promise.all([
        fetch(`/api/admin/courses/${c.id}`),
        fetch("/api/admin/users?role=STUDENT"),
        fetch("/api/admin/users?role=LECTURER"),
      ]);
      const courseData = await courseRes.json();
      const studData = await studRes.json();
      const lectData = await lectRes.json();

      setAllStudents(Array.isArray(studData) ? studData : []);
      setAllLecturers(Array.isArray(lectData) ? lectData : []);
      setEnrolledStudentIds(new Set((courseData.students ?? []).map((s: UserOption) => s.id)));
      setEnrolledLecturerIds(new Set((courseData.lecturers ?? []).map((l: UserOption) => l.id)));
    } finally {
      setEnrollLoading(false);
    }
  }

  async function saveEnrollment() {
    if (!enrollCourse) return;
    setEnrollSaving(true);
    await fetch(`/api/admin/courses/${enrollCourse.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentIds: Array.from(enrolledStudentIds),
        lecturerIds: Array.from(enrolledLecturerIds),
      }),
    });
    setEnrollSaving(false);
    setEnrollCourse(null);
    await load();
  }

  function toggleStudent(id: string) {
    setEnrolledStudentIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleLecturer(id: string) {
    setEnrolledLecturerIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalStudents = courses.reduce((sum, c) => sum + (c._count?.students ?? 0), 0);
  const totalAssessments = courses.reduce((sum, c) => sum + (c._count?.assessments ?? 0), 0);

  // Abbreviation for course badge
  function getCourseAbbr(code: string) {
    return code.replace(/[^A-Z]/g, "").slice(0, 2) || code.slice(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Manage Courses" subtitle="Organise academic courses by department" />

      <main className="flex-1 p-4 lg:p-8 space-y-6 bg-[#F8FAFC]">
        {/* Mobile heading */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-slate-900 font-heading">Manage Courses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Organise academic courses by department</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <StatCard
            label="Total Courses"
            value={courses.length}
            icon={<BookOpen size={22} />}
            color="indigo"
          />
          <StatCard
            label="Active Students"
            value={totalStudents}
            icon={<GraduationCap size={22} />}
            color="violet"
          />
          <StatCard
            label="Faculty Staff"
            value={courses.reduce((ids, c) => {
              (c.lecturers ?? []).forEach((l) => ids.add(l.id));
              return ids;
            }, new Set<string>()).size}
            icon={<UserCheck size={22} />}
            color="green"
          />
          <StatCard
            label="Total Assessments"
            value={totalAssessments}
            icon={<ClipboardList size={22} />}
            color="amber"
          />
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {courses.length} course{courses.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" onClick={openCreate}>
            <Plus size={15} /> Add New Course
          </Button>
        </div>

        {/* Create / Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold font-heading text-slate-900 text-lg">
                    {editing ? "Edit Course" : "New Course"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editing ? "Update course details." : "Create a new academic course."}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
                  <AlertCircle size={14} className="shrink-0" /> {formError}
                </div>
              )}
              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Course Name"
                  placeholder="e.g. Data Structures and Algorithms"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label="Course Code"
                  placeholder="e.g. CS-402"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                    required
                    className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select department</option>
                    {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={saving}>
                    <Check size={15} /> {editing ? "Save Changes" : "Create Course"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
                  <Trash2 size={18} />
                </div>
                <h2 className="font-bold font-heading text-slate-900">Delete Course?</h2>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                All assessments within this course will also be permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteId)}>Delete</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Enrollment Modal */}
        {enrollCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h2 className="font-bold font-heading text-slate-900">Manage Enrollment</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{enrollCourse.name} · {enrollCourse.code}</p>
                </div>
                <button
                  onClick={() => setEnrollCourse(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {enrollLoading ? (
                <div className="flex-1 px-6 py-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-2.5 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {/* Lecturers */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <UserCheck size={14} className="text-indigo-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Lecturers ({enrolledLecturerIds.size} selected)
                      </p>
                    </div>
                    {allLecturers.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No lecturers found. Add lecturers first.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {allLecturers.map((l) => (
                          <label
                            key={l.id}
                            className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                          >
                            <input
                              type="checkbox"
                              checked={enrolledLecturerIds.has(l.id)}
                              onChange={() => toggleLecturer(l.id)}
                              className="w-4 h-4 accent-indigo-600 rounded"
                            />
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {l.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{l.name}</p>
                              <p className="text-xs text-slate-400 truncate">
                                {l.email}{l.staffId ? ` · ${l.staffId}` : ""}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Students */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap size={14} className="text-violet-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Students ({enrolledStudentIds.size} selected)
                      </p>
                    </div>
                    {allStudents.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No students found. Add students first.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {allStudents.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                          >
                            <input
                              type="checkbox"
                              checked={enrolledStudentIds.has(s.id)}
                              onChange={() => toggleStudent(s.id)}
                              className="w-4 h-4 accent-violet-600 rounded"
                            />
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                              <p className="text-xs text-slate-400 truncate">
                                {s.email}{s.matricNumber ? ` · ${s.matricNumber}` : ""}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setEnrollCourse(null)}>Cancel</Button>
                <Button className="flex-1" loading={enrollSaving} onClick={saveEnrollment}>
                  <Check size={15} /> Save Enrollment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getCourseAbbr(c.code)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 leading-tight truncate">{c.name}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{c.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Manage enrollment"
                      onClick={() => openEnroll(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                    >
                      <Users size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      title="Edit course"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      title="Delete course"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <Badge variant="primary">{c.department.name}</Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-slate-50">
                    <GraduationCap size={12} className="text-violet-400" />
                    <span className="font-semibold text-slate-700">{c._count?.students ?? 0}</span>
                    <span className="text-slate-400">Students</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-slate-50">
                    <ClipboardList size={12} className="text-indigo-400" />
                    <span className="font-semibold text-slate-700">{c._count?.assessments ?? 0}</span>
                    <span className="text-slate-400">Assessments</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-slate-50">
                    <Users size={12} className="text-green-400" />
                    <span className="font-semibold text-slate-700">{(c.lecturers ?? []).length}</span>
                    <span className="text-slate-400">Lecturers</span>
                  </div>
                </div>
              </Card>
            ))}
            {courses.length === 0 && (
              <div className="col-span-3 flex flex-col items-center py-20 gap-4">
                <div className="p-5 rounded-2xl bg-slate-100 text-slate-400">
                  <BookOpen size={32} />
                </div>
                <div className="text-center">
                  <p className="text-slate-700 font-semibold font-heading">No courses yet</p>
                  <p className="text-slate-400 text-sm mt-1">Create your first course to get started.</p>
                </div>
                <Button size="sm" onClick={openCreate}>
                  <Plus size={14} /> Add Course
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
