"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Users,
  BookOpen,
  AlertCircle,
  Search,
  GraduationCap,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  _count: { users: number; courses: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/departments");
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ name: "", code: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(d: Department) {
    setEditing(d);
    setForm({ name: d.name, code: d.code });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const url = editing ? `/api/admin/departments/${editing.id}` : "/api/admin/departments";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? `Failed to save (${res.status}). Please try again.`);
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
    await fetch(`/api/admin/departments/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  }

  // Derived stats
  const totalUsers = departments.reduce((sum, d) => sum + (d._count?.users ?? 0), 0);
  const totalCourses = departments.reduce((sum, d) => sum + (d._count?.courses ?? 0), 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Manage Departments" subtitle="Create and manage academic departments" />

      <main className="flex-1 p-4 lg:p-8 space-y-6 bg-[#F8FAFC]">
        {/* Mobile heading */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-slate-900 font-heading">Manage Departments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage academic departments</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <StatCard
            label="Total Departments"
            value={departments.length}
            icon={<Building2 size={22} />}
            color="indigo"
          />
          <StatCard
            label="Faculty Members"
            value={totalUsers}
            icon={<Users size={22} />}
            color="violet"
          />
          <StatCard
            label="Catalog Courses"
            value={totalCourses}
            icon={<BookOpen size={22} />}
            color="green"
          />
          <StatCard
            label="Active Students"
            value={departments.reduce((s, d) => s + (d._count?.users ?? 0), 0)}
            icon={<GraduationCap size={22} />}
            color="amber"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500 hidden sm:block">
              {filtered.length} department{filtered.length !== 1 ? "s" : ""}
            </p>
            <Button onClick={openCreate} size="sm">
              <Plus size={15} />
              Add New Department
            </Button>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-slate-900 font-heading text-lg">
                    {editing ? "Edit Department" : "Establish a new academic division"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editing
                      ? "Update department details below."
                      : "Fill in the details to create a new department."}
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
                  label="Department Name"
                  placeholder="e.g. Computer Science & Engineering"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Department Code"
                    placeholder="e.g. CS-ENGR"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    required
                  />
                  <p className="text-xs text-slate-400 pl-0.5">Codes must be unique across departments.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={saving}>
                    <Check size={15} />
                    {editing ? "Save Changes" : "Create Department"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
                  <Trash2 size={18} />
                </div>
                <h2 className="font-bold text-slate-900 font-heading">Delete Department?</h2>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                This action cannot be undone. All linked courses and users will be unlinked from this
                department.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteId)}>
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Department Grid */}
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((d) => (
              <Card key={d.id} className="hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">{d.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 tracking-wider uppercase">
                        {d.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(d)}
                      title="Edit department"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(d.id)}
                      title="Delete department"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                    <Users size={12} className="text-indigo-400" />
                    <span className="font-semibold text-slate-700 text-sm">{d._count?.users ?? 0}</span>
                    <span className="text-slate-400">Members</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                    <BookOpen size={12} className="text-violet-400" />
                    <span className="font-semibold text-slate-700 text-sm">{d._count?.courses ?? 0}</span>
                    <span className="text-slate-400">Courses</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
                    <Building2 size={12} className="text-green-400" />
                    <span className="font-semibold text-slate-700 text-sm">
                      {new Date(d.createdAt).getFullYear()}
                    </span>
                    <span className="text-slate-400">Est.</span>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 flex flex-col items-center py-20 gap-4">
                <div className="p-5 rounded-2xl bg-slate-100 text-slate-400">
                  <Building2 size={32} />
                </div>
                <div className="text-center">
                  <p className="text-slate-700 font-semibold font-heading">
                    {search ? "No departments found" : "No departments yet"}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {search
                      ? `No results for "${search}". Try a different search.`
                      : "Create your first department to get started."}
                  </p>
                </div>
                {!search && (
                  <Button size="sm" onClick={openCreate}>
                    <Plus size={14} /> Add Department
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-400 text-center">
            Showing {filtered.length} of {departments.length} departments
          </p>
        )}
      </main>
    </div>
  );
}
