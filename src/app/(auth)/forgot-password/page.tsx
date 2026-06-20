"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Step = "email" | "sent" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep("sent");
  }

  async function handleResend() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    // On success, redirect to login
    setStep("email");
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {/* Brand logo — always shown */}
      <div className="flex justify-center mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
          <Brain size={28} className="text-white" />
        </div>
      </div>

      {/* ── State 1: Enter email ── */}
      {step === "email" && (
        <>
          <div className="text-center mb-7">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 mb-3">
              <Lock size={22} className="text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-heading">
              Forgot your password?
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Enter your institutional email and we&apos;ll send you a reset link.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRequest} className="space-y-4">
            <Input
              label="Institutional Email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={15} />}
              autoComplete="email"
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Send Reset Link
            </Button>
          </form>

          <p className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </p>
        </>
      )}

      {/* ── State 2: Email sent confirmation ── */}
      {step === "sent" && (
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">
            Check your email
          </h1>
          <p className="text-sm text-slate-500 mt-2 mb-1">
            A reset link was sent to{" "}
            <span className="font-semibold text-slate-700">{email}</span>.
          </p>
          <p className="text-xs text-slate-400 mb-7">
            It expires in 15 minutes. Check your spam folder if you don&apos;t see it.
          </p>

          <Button
            variant="secondary"
            className="w-full mb-4"
            loading={loading}
            onClick={handleResend}
          >
            Resend Email
          </Button>

          <Button
            variant="ghost"
            className="w-full text-indigo-600"
            onClick={() => setStep("reset")}
          >
            I have a reset code →
          </Button>

          <p className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </p>
        </div>
      )}

      {/* ── State 3: New password form ── */}
      {step === "reset" && (
        <>
          <div className="text-center mb-7">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 mb-3">
              <Lock size={22} className="text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-heading">
              Reset Password
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Choose a strong new password for your account.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Reset Password
            </Button>
          </form>

          <p className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
