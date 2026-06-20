"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/Card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  AlertCircle,
  GraduationCap,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  matricNumber: string | null;
  department: { name: string } | null;
  _count: { submissions: number };
}
interface Dept { id: string; name: string }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: "", email: "", matricNumber: "", departmentId: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        fetch("/api/admin/users?role=STUDENT"),
        fetch("/api/admin/departments"),
      ]);
      const uData = await uRes.json();
      const dData = await dRes.json();
      setStudents(Array.isArray(uData) ? uData : []);
      setDepts(Array.isArray(dData) ? dData : []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.matricNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", matricNumber: "", departmentId: "", password: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({ name: s.name, email: s.email, matricNumber: s.matricNumber ?? "", departmentId: "", password: "" });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      let res: Response;

      if (editing) {
        res = await fetch(`/api/admin/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            departmentId: form.departmentId || undefined,
          }),
        });
      } else {
        res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: "STUDENT",
            matricNumber: form.matricNumber.trim() || undefined,
            departmentId: form.departmentId || undefined,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? `Failed to save (${res.status}). Please try again.`);
        setSaving(false);
        return;
      }

      setShowForm(false);
      await load();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  }

  const totalSubmissions = students.reduce((sum, s) => sum + (s._count?.submissions ?? 0), 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Manage Students" subtitle="View, add and manage student accounts" />

      <main className="flex-1 p-4 lg:p-8 space-y-6 bg-[#F8FAFC]">
        {/* Mobile heading */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-slate-900 font-heading">Manage Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">View, add and manage student accounts</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <StatCard
            label="Total Students"
            value={students.length}
            icon={<GraduationCap size={22} />}
            color="indigo"
          />
          <StatCard
            label="Total Submissions"
            value={totalSubmissions}
            icon={<ClipboardList size={22} />}
            color="violet"
          />
          <StatCard
            label="Active Now"
            value={students.length}
            icon={<TrendingUp size={22} />}
            color="green"
          />
          <StatCard
            label="Departments"
            value={depts.length}
            icon={<AlertTriangle size={22} />}
            color="amber"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or matric number…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus size={15} /> Add Student
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold font-heading text-slate-900 text-lg">
                    {editing ? "Edit Student" : "New Student"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editing ? "Update student details." : "Enroll a new student in the system."}
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
                  <AlertCircle size={14} className="shrink-0" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. j.smith@student.edu"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  disabled={!!editing}
                />
                {!editing && (
                  <>
                    <Input
                      label="Matric Number (optional)"
                      placeholder="e.g. CS/2021/001"
                      value={form.matricNumber}
                      onChange={(e) => setForm((f) => ({ ...f, matricNumber: e.target.value }))}
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      required
                    />
                  </>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Department (optional)
                  </label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">— None —</option>
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={saving}>
                    <Check size={15} /> {editing ? "Save Changes" : "Enroll Student"}
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
                <h2 className="font-bold font-heading text-slate-900">Remove Student?</h2>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                All exam submissions for this student will also be permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteId)}>Delete</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
            <div className="px-5 lg:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 font-heading">
                Student Directory
              </p>
              <p className="text-xs text-slate-400">
                {filtered.length} of {students.length} students
              </p>
            </div>
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Matric No.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Submissions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{s.email}</td>
                    <td className="px-6 py-3.5">
                      {s.matricNumber ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                          {s.matricNumber}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {s.department ? (
                        <Badge variant="info">{s.department.name}</Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-slate-600 font-medium">{s._count?.submissions ?? 0}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(s)}
                          title="Edit student"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          title="Delete student"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <GraduationCap size={28} className="text-slate-300" />
                        <p className="text-slate-400 text-sm">
                          {search ? "No students match your search." : "No students yet. Click Add Student to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
