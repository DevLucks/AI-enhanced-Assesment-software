"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { CheckCircle, AlertCircle, User, Lock } from "lucide-react";

interface Props {
  userId: string;
  name: string;
  email: string;
}

export default function UpdateProfileForm({ userId, name, email }: Props) {
  const [form, setForm] = useState({
    name,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    if (form.newPassword && form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          ...(form.newPassword
            ? {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
              }
            : {}),
        }),
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
        setError(data.error ?? "Failed to update profile.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Success / Error messages */}
        {success && (
          <div className="flex items-center gap-2.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <CheckCircle size={15} className="shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Personal Information Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <User size={13} className="text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900">Personal Information</h3>
          </div>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              required
              placeholder="Your full name"
            />
            <Input
              label="Email Address"
              value={email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400">
              Your email address cannot be changed. Contact an administrator if
              you need to update it.
            </p>
          </div>
        </div>

        {/* Password Section */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Lock size={13} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Leave blank to keep your current password
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              value={form.currentPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Min. 8 characters"
                value={form.newPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, newPassword: e.target.value }))
                }
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving}>
            <CheckCircle size={15} />
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
