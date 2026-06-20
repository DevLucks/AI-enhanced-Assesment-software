"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Flag,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Menu,
  BookOpen,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface Option {
  id: string;
  label: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  marks: number;
  options: Option[];
}

interface Assessment {
  id: string;
  title: string;
  duration: number;
  totalMarks: number;
  course: { name: string; code: string };
  questions: Question[];
}

interface Props {
  assessment: Assessment;
  submissionId: string;
}

export default function ExamClient({ assessment, submissionId }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(assessment.duration * 60);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const submitRef = useRef(false);

  const q = assessment.questions[current];
  const total = assessment.questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = total - answeredCount;

  // Format time as HH:MM:SS
  const hh = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const mm = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const isLow = timeLeft < 300; // < 5 minutes
  const timeDisplay = assessment.duration >= 60 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

  const doSubmit = useCallback(async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    setSubmitting(true);
    setShowConfirm(false);

    const payload = assessment.questions.map((q) => ({
      questionId: q.id,
      ...(q.type === "OBJECTIVE"
        ? { selectedOptionId: answers[q.id] ?? null }
        : { answerText: answers[q.id] ?? null }),
    }));

    await fetch(`/api/student/assessments/${assessment.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, answers: payload }),
    });

    router.push("/student/results");
  }, [answers, assessment, submissionId, router]);

  // Countdown timer — auto-submits at 0
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          doSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleFlag(qId: string) {
    setFlagged((f) => {
      const n = new Set(f);
      n.has(qId) ? n.delete(qId) : n.add(qId);
      return n;
    });
  }

  function getStatus(idx: number): "current" | "answered" | "flagged" | "unanswered" {
    if (idx === current) return "current";
    const qId = assessment.questions[idx].id;
    if (flagged.has(qId)) return "flagged";
    if (answers[qId]) return "answered";
    return "unanswered";
  }

  const navColor: Record<string, string> = {
    current: "bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1",
    answered: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    flagged: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    unanswered: "bg-slate-100 text-slate-500 hover:bg-slate-200",
  };

  const progressPct = Math.round((answeredCount / total) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-100 px-4 lg:px-6 h-14 shadow-sm gap-3">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle question panel"
          >
            <Menu size={18} />
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
            <Brain size={15} className="text-white" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-bold text-slate-900 font-heading leading-none truncate">
              {assessment.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{assessment.course.code}</p>
          </div>
        </div>

        {/* Center: timer */}
        <div
          className={`flex items-center gap-2 font-mono text-base font-bold px-4 py-1.5 rounded-xl transition-all
            ${isLow
              ? "bg-red-50 text-red-600 animate-pulse"
              : "bg-slate-100 text-slate-700"
            }`}
        >
          <Clock size={14} className={isLow ? "text-red-500" : "text-slate-400"} />
          {timeDisplay}
        </div>

        {/* Right: submit */}
        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowConfirm(true)}
          loading={submitting}
          className="shrink-0"
        >
          Submit Exam
        </Button>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar / Question grid ── */}
        <aside
          className={`
            flex-shrink-0 w-56 border-r border-slate-200 bg-white p-4 flex flex-col gap-4
            transition-all duration-200
            ${sidebarOpen ? "flex" : "hidden"}
            lg:flex
          `}
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Questions ({total})
          </p>

          {/* Question number grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {assessment.questions.map((_, i) => {
              const status = getStatus(i);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrent(i);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`h-8 w-full rounded-lg text-xs font-bold transition-all ${navColor[status]}`}
                  aria-label={`Question ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs text-slate-500 mt-1">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-emerald-200 inline-block" />
              Answered ({answeredCount})
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-amber-200 inline-block" />
              Flagged ({flagged.size})
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-slate-200 inline-block" />
              Unanswered ({unansweredCount})
            </div>
          </div>

          {/* Progress */}
          <div className="mt-auto">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </aside>

        {/* ── Main question area ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Question header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Question {current + 1} of {total}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {q.marks} mark{q.marks !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {q.type === "OBJECTIVE" ? "Multiple Choice" : "Written Answer"}
                </span>
              </div>
            </div>

            {/* Question text card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <p className="text-base text-slate-900 leading-relaxed font-medium">
                {q.text}
              </p>
            </div>

            {/* OBJECTIVE — radio options */}
            {q.type === "OBJECTIVE" && (
              <div className="space-y-3">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none
                        ${selected
                          ? "border-indigo-500 bg-indigo-50 shadow-sm"
                          : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                    >
                      {/* Hidden native radio */}
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={selected}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [q.id]: opt.id }))
                        }
                        className="sr-only"
                      />
                      {/* Custom radio */}
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                          ${selected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"}`}
                      >
                        {selected && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      {/* Label letter */}
                      <span
                        className={`text-sm font-bold w-5 flex-shrink-0 ${
                          selected ? "text-indigo-600" : "text-slate-400"
                        }`}
                      >
                        {opt.label}.
                      </span>
                      {/* Option text */}
                      <span
                        className={`text-sm flex-1 ${
                          selected ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {opt.text}
                      </span>
                      {selected && (
                        <CheckCircle
                          size={15}
                          className="flex-shrink-0 text-indigo-500"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            {/* SUBJECTIVE — textarea */}
            {q.type === "SUBJECTIVE" && (
              <div>
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                  }
                  placeholder="Write your answer here…"
                  rows={8}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-4 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-400 resize-none transition-colors placeholder:text-slate-300"
                />
                <p className="text-xs text-slate-400 mt-1.5 text-right">
                  {(answers[q.id] ?? "").length} characters
                </p>
              </div>
            )}

            {/* Bottom navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setCurrent((c) => c - 1)}
                disabled={current === 0}
                className="gap-1"
              >
                <ChevronLeft size={15} /> Previous
              </Button>

              {/* Flag button */}
              <button
                onClick={() => toggleFlag(q.id)}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all border ${
                  flagged.has(q.id)
                    ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-amber-600 hover:border-amber-200"
                }`}
              >
                <Flag size={13} />
                {flagged.has(q.id) ? "Flagged" : "Flag for Review"}
              </button>

              {current < total - 1 ? (
                <Button
                  onClick={() => setCurrent((c) => c + 1)}
                  className="gap-1"
                >
                  Next <ChevronRight size={15} />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirm(true)}
                  loading={submitting}
                  className="gap-1"
                >
                  <CheckCircle size={14} /> Submit
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Confirmation dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-amber-500" />
            </div>

            <h3 className="text-center font-bold text-slate-900 font-heading text-lg mb-2">
              Submit Exam?
            </h3>

            <p className="text-center text-sm text-slate-500 mb-1">
              {unansweredCount > 0 ? (
                <>
                  You have{" "}
                  <span className="font-semibold text-red-600">
                    {unansweredCount} unanswered question
                    {unansweredCount > 1 ? "s" : ""}
                  </span>
                  .
                </>
              ) : (
                "You have answered all questions."
              )}
            </p>
            <p className="text-center text-xs text-slate-400 mb-6">
              Once submitted, you cannot change your answers.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-700">
                  {answeredCount}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">Answered</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-amber-700">
                  {flagged.size}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Flagged</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-700">
                  {unansweredCount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Skipped</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                <X size={14} /> Go Back
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={doSubmit}
                loading={submitting}
              >
                <CheckCircle size={14} /> Confirm Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
