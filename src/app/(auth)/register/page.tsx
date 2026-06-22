"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  User,
  Mail,
  Hash,
  Lock,
  Phone,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const passwordStrength = (pw: string) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strength = passwordStrength(form.password);
  const strengthColor = [
    "bg-slate-200",
    "bg-red-400",
    "bg-amber-400",
    "bg-blue-400",
    "bg-emerald-500",
  ][strength];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (strength < 2) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          idNumber: form.idNumber,
          role: "STUDENT",
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-heading mb-2">
          Account Created!
        </h2>
        <p className="text-sm text-slate-500">
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {/* Brand */}
      <div className="flex flex-col items-center mb-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 mb-4">
          <Brain size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading">
          Student Sign Up
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create your student account to get started
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          icon={<User size={15} />}
          autoComplete="name"
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@university.edu"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          icon={<Mail size={15} />}
          autoComplete="email"
          required
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="e.g. 08012345678"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          icon={<Phone size={15} />}
          autoComplete="tel"
        />

        {/* ID field */}
        <Input
          label="Matric Number"
          type="text"
          placeholder="e.g. CPE/2022/001"
          value={form.idNumber}
          onChange={(e) => set("idNumber", e.target.value)}
          icon={<Hash size={15} />}
          required
        />

        {/* Password with strength meter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock size={15} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 px-3 py-2.5 pl-10 pr-10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.password && (
            <div className="space-y-1.5 mt-0.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                      i <= strength ? strengthColor : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              {strengthLabel && (
                <p className="text-xs text-slate-400">
                  {strengthLabel} password
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Confirm Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock size={15} />
            </span>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 px-3 py-2.5 pl-10 pr-10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Lecturer accounts are created by the system administrator.
      </p>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
        >
          <ArrowLeft size={13} />
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
