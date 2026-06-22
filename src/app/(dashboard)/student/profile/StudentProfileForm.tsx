"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { CheckCircle, AlertCircle, KeyRound, User, Phone } from "lucide-react";

export default function StudentProfileForm({
  userId,
  name,
  email,
  phone,
}: {
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
}) {
  const [form, setForm] = useState({
    name,
    phone: phone ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    if (form.newPassword && !form.currentPassword) {
      setError("Please enter your current password to set a new one.");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { name: form.name, phone: form.phone };
      if (form.newPassword) {
        body.currentPassword = form.currentPassword;
        body.newPassword = form.newPassword;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess("Profile updated successfully.");
        setForm((f) => ({
          ...f,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to update profile. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
          <User size={15} />
        </div>
        <h3 className="font-bold text-slate-900 font-heading">
          Personal Information
        </h3>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
          <CheckCircle size={15} className="shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal info fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={set("name")}
            required
            placeholder="Your full name"
          />
          <Input
            label="Email Address"
            value={email}
            disabled
            placeholder="Email"
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={set("phone")}
            placeholder="e.g. 08012345678"
            icon={<Phone size={14} />}
          />
        </div>

        {/* Password section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500">
              <KeyRound size={13} />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Change Password
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={form.currentPassword}
              onChange={set("currentPassword")}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={form.newPassword}
              onChange={set("newPassword")}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              error={
                form.newPassword &&
                form.confirmPassword &&
                form.newPassword !== form.confirmPassword
                  ? "Passwords don't match"
                  : undefined
              }
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Leave password fields empty if you don&apos;t want to change it.
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving} size="md">
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
