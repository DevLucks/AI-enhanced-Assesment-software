"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { GradeCircle } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Brain,
  ChevronRight,
  CheckCircle,
  Edit3,
  Users,
  AlertTriangle,
  Send,
  Sparkles,
} from "lucide-react";

interface Answer {
  id: string;
  answerText: string | null;
  selectedOption: string | null;
  marksAwarded: number | null;
  aiFeedback: string | null;
  aiConfidence: number | null;
  question: {
    text: string;
    type: string;
    marks: number;
    modelAnswer: string | null;
    options: { id: string; label: string; text: string; isCorrect: boolean }[];
  };
}

interface Submission {
  id: string;
  student: { name: string; matricNumber: string | null };
  result: { totalMarks: number; grade: string } | null;
  answers: Answer[];
}

interface Assessment {
  id: string;
  totalMarks: number;
  submissions: Submission[];
}

export default function GradeReviewPanel({
  assessment,
}: {
  assessment: Assessment;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Submission | null>(
    assessment.submissions[0] ?? null
  );
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(
    assessment.submissions[0]?.answers[0] ?? null
  );
  const [override, setOverride] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [grading, setGrading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  function selectStudent(s: Submission) {
    setSelected(s);
    setSelectedAnswer(s.answers[0] ?? null);
    setOverride("");
    setNote("");
    setSavedMsg("");
  }

  function selectAnswer(a: Answer) {
    setSelectedAnswer(a);
    setOverride("");
    setNote("");
    setSavedMsg("");
  }

  async function handleOverride() {
    if (!selectedAnswer) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await fetch(`/api/lecturer/results`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerId: selectedAnswer.id,
          marksAwarded: Number(override),
          lecturerNote: note,
        }),
      });
      setSavedMsg("Override saved successfully.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveAI() {
    if (!selectedAnswer || selectedAnswer.marksAwarded === null) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await fetch(`/api/lecturer/results`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerId: selectedAnswer.id,
          marksAwarded: selectedAnswer.marksAwarded,
          lecturerNote: "AI grade approved by lecturer.",
        }),
      });
      setSavedMsg("AI grade approved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRunGrading() {
    if (!selected) return;
    setGrading(true);
    setSavedMsg("");
    try {
      const res = await fetch(`/api/grading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: selected.id }),
      });
      if (res.ok) {
        setSavedMsg("AI grading complete. Refreshing...");
        router.refresh();
      } else {
        setSavedMsg("AI grading failed. Check logs.");
      }
    } finally {
      setGrading(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await fetch(`/api/lecturer/assessments/${assessment.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish-results" }),
      });
      router.refresh();
    } finally {
      setPublishing(false);
    }
  }

  const confidence = selectedAnswer?.aiConfidence ?? null;
  const confPct = confidence !== null ? Math.round(confidence * 100) : null;
  const confColor =
    confidence === null
      ? "text-slate-400"
      : confidence >= 0.8
      ? "text-emerald-600"
      : confidence >= 0.5
      ? "text-amber-600"
      : "text-red-500";
  const confBg =
    confidence === null
      ? "bg-slate-50"
      : confidence >= 0.8
      ? "bg-emerald-50"
      : confidence >= 0.5
      ? "bg-amber-50"
      : "bg-red-50";

  return (
    <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
      {/* ============================================================
          LEFT PANEL — Student List
      ============================================================ */}
      <aside className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-slate-400" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Students
            </p>
            <span className="ml-auto text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
              {assessment.submissions.length}
            </span>
          </div>
        </div>

        {/* Student list */}
        <div className="overflow-y-auto flex-1">
          {assessment.submissions.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-400 text-center">
              No submissions.
            </p>
          ) : (
            assessment.submissions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectStudent(s)}
                className={`w-full flex items-center justify-between px-4 py-3 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors ${
                  selected?.id === s.id
                    ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {s.student.name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {s.student.matricNumber ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {s.result ? (
                    <GradeCircle grade={s.result.grade} />
                  ) : (
                    <Badge variant="warning" className="text-xs">Pending</Badge>
                  )}
                  <ChevronRight size={13} className="text-slate-300" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Publish All Results */}
        <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
          <Button
            className="w-full"
            size="sm"
            loading={publishing}
            onClick={handlePublish}
          >
            <Send size={13} />
            Publish All Results
          </Button>
        </div>
      </aside>

      {/* ============================================================
          CENTER PANEL — Answers List
      ============================================================ */}
      {selected ? (
        <div className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-white flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {selected.student.name}&apos;s Answers
                </p>
                {selected.result && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total: {selected.result.totalMarks.toFixed(1)} pts
                  </p>
                )}
              </div>
              <button
                onClick={handleRunGrading}
                disabled={grading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
              >
                <Sparkles size={12} />
                {grading ? "Grading..." : "Run AI"}
              </button>
            </div>
          </div>

          {/* Answer list */}
          <div className="overflow-y-auto flex-1">
            {selected.answers.map((a, i) => {
              const scored = a.marksAwarded !== null;
              return (
                <button
                  key={a.id}
                  onClick={() => selectAnswer(a)}
                  className={`w-full flex items-start justify-between px-4 py-3.5 border-b border-slate-100 text-left hover:bg-white transition-colors ${
                    selectedAnswer?.id === a.id
                      ? "bg-white border-l-4 border-l-indigo-400"
                      : "border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-500">
                        Q{i + 1}
                      </span>
                      <Badge
                        variant={
                          a.question.type === "OBJECTIVE" ? "info" : "primary"
                        }
                      >
                        {a.question.type === "OBJECTIVE" ? "MCQ" : "Essay"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {a.question.text}
                    </p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <span
                      className={`text-xs font-bold ${
                        scored ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      {a.marksAwarded ?? "?"}/{a.question.marks}
                    </span>
                    {!scored && (
                      <AlertTriangle
                        size={11}
                        className="text-amber-400 mt-1 ml-auto"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex w-64 flex-shrink-0 border-r border-slate-200 items-center justify-center bg-slate-50 text-sm text-slate-400">
          Select a student
        </div>
      )}

      {/* ============================================================
          RIGHT PANEL — AI Analysis & Override
      ============================================================ */}
      {selectedAnswer ? (
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-5">
          {/* Question */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Question
            </p>
            <p className="text-sm text-slate-800 leading-relaxed">
              {selectedAnswer.question.text}
            </p>
          </div>

          {/* Student Answer */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Student Answer
            </p>
            {selectedAnswer.question.type === "OBJECTIVE" ? (() => {
              const chosen = selectedAnswer.question.options.find(
                (o) => o.id === selectedAnswer.selectedOption
              );
              return chosen ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-bold">{chosen.label}.</span> {chosen.text}
                </p>
              ) : (
                <span className="text-sm text-slate-300 italic">No answer provided</span>
              );
            })() : (
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedAnswer.answerText ?? (
                  <span className="text-slate-300 italic">No answer provided</span>
                )}
              </p>
            )}
          </div>

          {/* AI Analysis */}
          {selectedAnswer.aiFeedback ? (
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-4">
              {/* AI header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Brain size={14} className="text-white" />
                </div>
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                  AI Analysis
                </p>
              </div>

              {/* Score + Confidence */}
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-white rounded-xl border border-indigo-100 px-4 py-3 text-center flex-1">
                  <p className="text-xs text-slate-500 mb-0.5">AI Score</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {selectedAnswer.marksAwarded ?? "—"}
                    <span className="text-sm font-normal text-slate-400">
                      /{selectedAnswer.question.marks}
                    </span>
                  </p>
                </div>
                {confPct !== null && (
                  <div
                    className={`${confBg} rounded-xl border border-slate-100 px-4 py-3 text-center flex-1`}
                  >
                    <p className="text-xs text-slate-500 mb-0.5">Confidence</p>
                    <p className={`text-2xl font-bold ${confColor}`}>
                      {confPct}%
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback */}
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedAnswer.aiFeedback}
              </p>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-xl p-4 text-center">
              <Brain size={20} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No AI analysis available</p>
              <p className="text-xs text-slate-300 mt-0.5">
                AI grading may not have run for this answer yet
              </p>
            </div>
          )}

          {/* Override Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Edit3 size={14} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Grade Override
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  New Score (max {selectedAnswer.question.marks})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedAnswer.question.marks}
                  value={override}
                  onChange={(e) => setOverride(e.target.value)}
                  placeholder={String(selectedAnswer.marksAwarded ?? "")}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  Reason (optional)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for override…"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                />
              </div>
            </div>

            {savedMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle size={13} />
                {savedMsg}
              </div>
            )}

            <div className="flex gap-2">
              {selectedAnswer.aiFeedback && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={saving}
                  onClick={handleApproveAI}
                >
                  <CheckCircle size={13} />
                  Approve AI Score
                </Button>
              )}
              <Button
                size="sm"
                variant="primary"
                loading={saving}
                onClick={handleOverride}
                disabled={!override}
              >
                <Edit3 size={13} />
                Save Override
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <Brain size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              Select a student and answer to review
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Use the panels on the left to navigate
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
