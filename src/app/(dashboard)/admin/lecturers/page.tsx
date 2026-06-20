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
  Users,
  BookOpen,
  UserCheck,
  UserPlus,
} from "lucide-react";

interface Lecturer {
  id: string;
  name: string;
  email: string;
  staffId: string | null;
  department: { name: string } | null;
  _count: { taughtCourses: number };
}
interface Dept { id: string; name: string }

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lecturer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", staffId: "", departmentId: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        fetch("/api/admin/users?role=LECTURER"),
        fetch("/api/admin/departments"),
      ]);
      const uData = await uRes.json();
      const dData = await dRes.json();
      setLecturers(Array.isArray(uData) ? uData : []);
      setDepts(Array.isArray(dData) ? dData : []);
    } catch {
      setLecturers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = lecturers.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", staffId: "", departmentId: "", password: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(l: Lecturer) {
    setEditing(l);
    setForm({ name: l.name, email: l.email, staffId: l.staffId ?? "", departmentId: "", password: "" });
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
            role: "LECTURER",
            staffId: form.staffId.trim() || undefined,
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

  const totalCourses = lecturers.reduce((sum, l) => sum + (l._count?.taughtCourses ?? 0), 0);
  const activeCount = lecturers.length; // all listed lecturers are considered active

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Manage Lecturers" subtitle="View, add and manage lecturer accounts" />

      <main className="flex-1 p-4 lg:p-8 space-y-6 bg-[#F8FAFC]">
        {/* Mobile heading */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-slate-900 font-heading">Manage Lecturers</h1>
          <p className="text-sm text-slate-500 mt-0.5">View, add and manage lecturer accounts</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <StatCard
            label="Total Lecturers"
            value={lecturers.length}
            icon={<Users size={22} />}
            color="indigo"
          />
          <StatCard
            label="Total Courses"
            value={totalCourses}
            icon={<BookOpen size={22} />}
            color="violet"
          />
          <StatCard
            label="Active Staff"
            value={activeCount}
            icon={<UserCheck size={22} />}
            color="green"
          />
          <StatCard
            label="Departments"
            value={depts.length}
            icon={<UserPlus size={22} />}
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
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus size={15} /> Add Lecturer
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold font-heading text-slate-900 text-lg">
                    {editing ? "Edit Lecturer" : "New Lecturer"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editing ? "Update lecturer details." : "Add a new lecturer to the system."}
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
                  placeholder="e.g. Dr. Alan Turing"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. a.turing@edu.ac"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  disabled={!!editing}
                />
                {!editing && (
                  <>
                    <Input
                      label="Staff ID (optional)"
                      placeholder="e.g. STF-0042"
                      value={form.staffId}
                      onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
                    />
                    <Input
                      label="Temporary Password"
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
                    <Check size={15} /> {editing ? "Save Changes" : "Create Lecturer"}
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
                <h2 className="font-bold font-heading text-slate-900">Remove Lecturer?</h2>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                This will permanently delete the lecturer account and unlink all associated courses.
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
                Staff Directory
              </p>
              <p className="text-xs text-slate-400">
                {filtered.length} of {lecturers.length} lecturers
              </p>
            </div>
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Staff ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Courses</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr
                    key={l.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {l.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{l.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{l.email}</td>
                    <td className="px-6 py-3.5">
                      {l.staffId ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                          #{l.staffId}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {l.department ? (
                        <Badge variant="primary">{l.department.name}</Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-slate-600 font-medium">{l._count?.taughtCourses ?? 0}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(l)}
                          title="Edit lecturer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(l.id)}
                          title="Delete lecturer"
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
                        <Users size={28} className="text-slate-300" />
                        <p className="text-slate-400 text-sm">
                          {search ? "No lecturers match your search." : "No lecturers yet. Click Add Lecturer to get started."}
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
