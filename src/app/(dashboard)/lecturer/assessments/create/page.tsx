"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  FileText,
  HelpCircle,
  Eye,
} from "lucide-react";

interface Question {
  text: string;
  type: "OBJECTIVE" | "SUBJECTIVE";
  marks: number;
  modelAnswer: string;
  options: { label: string; text: string; isCorrect: boolean }[];
}

interface Course {
  id: string;
  name: string;
  code: string;
}

const STEPS = [
  { label: "Details", icon: FileText },
  { label: "Questions", icon: HelpCircle },
  { label: "Review", icon: Eye },
];

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [details, setDetails] = useState({
    title: "",
    description: "",
    courseId: "",
    duration: 60,
    totalMarks: 100,
    startTime: "",
    endTime: "",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/lecturer/courses")
      .then((r) => r.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []));
  }, []);

  function addQuestion(type: "OBJECTIVE" | "SUBJECTIVE" = "OBJECTIVE") {
    setQuestions((q) => [
      ...q,
      {
        text: "",
        type,
        marks: 5,
        modelAnswer: "",
        options:
          type === "OBJECTIVE"
            ? [
                { label: "A", text: "", isCorrect: true },
                { label: "B", text: "", isCorrect: false },
                { label: "C", text: "", isCorrect: false },
                { label: "D", text: "", isCorrect: false },
              ]
            : [],
      },
    ]);
  }

  function updateQ(i: number, field: keyof Question, val: unknown) {
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== i) return q;
        const updated = { ...q, [field]: val };
        // When switching type, reset options / modelAnswer
        if (field === "type") {
          if (val === "OBJECTIVE") {
            updated.options = [
              { label: "A", text: "", isCorrect: true },
              { label: "B", text: "", isCorrect: false },
              { label: "C", text: "", isCorrect: false },
              { label: "D", text: "", isCorrect: false },
            ];
            updated.modelAnswer = "";
          } else {
            updated.options = [];
          }
        }
        return updated;
      })
    );
  }

  function updateOption(
    qi: number,
    oi: number,
    field: "text" | "isCorrect",
    val: string | boolean
  ) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const opts = q.options.map((o, j) =>
          j === oi
            ? { ...o, [field]: val }
            : field === "isCorrect" && val
            ? { ...o, isCorrect: false }
            : o
        );
        return { ...q, options: opts };
      })
    );
  }

  async function handleSubmit() {
    setError("");
    setSaving(true);

    try {
      // Step 1: create the assessment shell
      const assessmentRes = await fetch("/api/lecturer/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: details.title,
          description: details.description || undefined,
          courseId: details.courseId,
          duration: details.duration,
          totalMarks: details.totalMarks,
          startTime: details.startTime
            ? new Date(details.startTime).toISOString()
            : undefined,
          endTime: details.endTime
            ? new Date(details.endTime).toISOString()
            : undefined,
        }),
      });

      if (!assessmentRes.ok) {
        const data = await assessmentRes.json().catch(() => ({}));
        setError(data.error ?? "Failed to create assessment.");
        setSaving(false);
        return;
      }

      const assessment = await assessmentRes.json();

      // Step 2: save each question in order
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qRes = await fetch(
          `/api/lecturer/assessments/${assessment.id}/questions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: q.text,
              type: q.type,
              marks: q.marks,
              order: i,
              modelAnswer:
                q.type === "SUBJECTIVE" ? q.modelAnswer : undefined,
              options: q.type === "OBJECTIVE" ? q.options : undefined,
            }),
          }
        );

        if (!qRes.ok) {
          const data = await qRes.json().catch(() => ({}));
          setError(data.error ?? `Failed to save question ${i + 1}.`);
          setSaving(false);
          return;
        }
      }

      router.push(`/lecturer/assessments/${assessment.id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSaving(false);
    }
  }

  const stepValid = [
    !!(details.title && details.courseId && details.duration > 0),
    questions.length > 0,
    true,
  ];

  const selectedCourse = courses.find((c) => c.id === details.courseId);
  const totalQuestionMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="flex flex-col flex-1 bg-slate-50 min-h-screen">
      <Header
        title="Create Assessment"
        subtitle="Build and configure a new assessment in 3 steps"
      />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto w-full space-y-6">

          {/* Step Wizard Indicator */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
            <div className="flex items-center">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isCompleted = i < step;
                const isCurrent = i === step;
                return (
                  <div key={s.label} className="flex items-center flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 shrink-0
                          ${isCompleted
                            ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                            : isCurrent
                            ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-200 ring-4 ring-indigo-100"
                            : "bg-slate-100 text-slate-400"
                          }`}
                      >
                        {isCompleted ? <Check size={15} /> : <Icon size={15} />}
                      </div>
                      <div className="hidden sm:block">
                        <p
                          className={`text-xs font-semibold ${
                            isCurrent ? "text-indigo-700" : isCompleted ? "text-slate-700" : "text-slate-400"
                          }`}
                        >
                          Step {i + 1}
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            isCurrent ? "text-slate-900" : isCompleted ? "text-slate-600" : "text-slate-300"
                          }`}
                        >
                          {s.label}
                        </p>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`flex-1 mx-4 h-0.5 rounded-full transition-all duration-300 ${
                          i < step ? "bg-indigo-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---- Step 0: Details ---- */}
          {step === 0 && (
            <Card>
              <h2 className="font-bold text-slate-900 text-base mb-1">
                Assessment Details
              </h2>
              <p className="text-sm text-slate-400 mb-5">
                Configure basic information about the assessment
              </p>

              {courses.length === 0 && (
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mb-5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    You are not assigned to any courses yet. Ask an administrator
                    to assign you to a course first.
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Assessment Title"
                  placeholder="e.g. Midterm Examination 2026"
                  value={details.title}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, title: e.target.value }))
                  }
                  required
                />

                {/* Course Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Course <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={details.courseId}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, courseId: e.target.value }))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    required
                  >
                    <option value="">Select a course…</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Duration (minutes)"
                    type="number"
                    min={5}
                    value={details.duration}
                    onChange={(e) =>
                      setDetails((d) => ({
                        ...d,
                        duration: Number(e.target.value),
                      }))
                    }
                  />
                  <Input
                    label="Total Marks"
                    type="number"
                    min={1}
                    value={details.totalMarks}
                    onChange={(e) =>
                      setDetails((d) => ({
                        ...d,
                        totalMarks: Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Time (optional)"
                    type="datetime-local"
                    value={details.startTime}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, startTime: e.target.value }))
                    }
                  />
                  <Input
                    label="End Time (optional)"
                    type="datetime-local"
                    value={details.endTime}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, endTime: e.target.value }))
                    }
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Description (optional)
                  </label>
                  <textarea
                    value={details.description}
                    onChange={(e) =>
                      setDetails((d) => ({
                        ...d,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Instructions for students…"
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ---- Step 1: Questions ---- */}
          {step === 1 && (
            <div className="space-y-4">
              {questions.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                      <HelpCircle size={22} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-slate-700 font-semibold text-sm">
                        No questions added yet
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Add your first question below
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {questions.map((q, qi) => (
                <Card key={qi}>
                  {/* Question header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">
                          {qi + 1}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                        {q.type === "OBJECTIVE" ? "Multiple Choice" : "Essay / Subjective"}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setQuestions((qs) => qs.filter((_, i) => i !== qi))
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Question text */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Question Text
                      </label>
                      <textarea
                        value={q.text}
                        onChange={(e) => updateQ(qi, "text", e.target.value)}
                        rows={2}
                        placeholder="Enter your question here…"
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                      />
                    </div>

                    {/* Type + Marks row */}
                    <div className="flex gap-4 items-end">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Question Type
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            updateQ(
                              qi,
                              "type",
                              e.target.value as "OBJECTIVE" | "SUBJECTIVE"
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="OBJECTIVE">Objective (MCQ)</option>
                          <option value="SUBJECTIVE">Subjective (Essay)</option>
                        </select>
                      </div>
                      <div className="w-28">
                        <Input
                          label="Marks"
                          type="number"
                          min={1}
                          value={q.marks}
                          onChange={(e) =>
                            updateQ(qi, "marks", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {q.type === "OBJECTIVE" && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Answer Options — select the correct answer
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <label
                              key={oi}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                opt.isCorrect
                                  ? "border-indigo-300 bg-indigo-50"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                checked={opt.isCorrect}
                                onChange={() =>
                                  updateOption(qi, oi, "isCorrect", true)
                                }
                                className="accent-indigo-500 shrink-0"
                              />
                              <span
                                className={`text-sm font-bold w-5 shrink-0 ${
                                  opt.isCorrect
                                    ? "text-indigo-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {opt.label}.
                              </span>
                              <input
                                value={opt.text}
                                onChange={(e) =>
                                  updateOption(qi, oi, "text", e.target.value)
                                }
                                placeholder={`Option ${opt.label}`}
                                className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 placeholder:text-slate-300"
                              />
                              {opt.isCorrect && (
                                <span className="text-xs font-semibold text-indigo-600 shrink-0">
                                  Correct
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subjective model answer */}
                    {q.type === "SUBJECTIVE" && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Model Answer{" "}
                          <span className="normal-case font-normal text-slate-400">
                            (used by AI grader)
                          </span>
                        </label>
                        <textarea
                          value={q.modelAnswer}
                          onChange={(e) =>
                            updateQ(qi, "modelAnswer", e.target.value)
                          }
                          rows={3}
                          placeholder="Write the ideal answer that the AI will compare student responses against…"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                        />
                        <p className="text-xs text-slate-400">
                          A detailed model answer helps the AI grade more accurately.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Add question buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => addQuestion("OBJECTIVE")}
                >
                  <Plus size={15} />
                  Add MCQ Question
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 border border-slate-200"
                  onClick={() => addQuestion("SUBJECTIVE")}
                >
                  <Plus size={15} />
                  Add Essay Question
                </Button>
              </div>

              {questions.length > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-500 bg-white rounded-xl border border-slate-100 px-4 py-3">
                  <span>
                    <span className="font-semibold text-slate-700">{questions.length}</span>{" "}
                    question{questions.length !== 1 ? "s" : ""} ·{" "}
                    <span className="font-semibold text-slate-700">{totalQuestionMarks}</span> marks
                  </span>
                  <span className={totalQuestionMarks !== details.totalMarks ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                    {totalQuestionMarks !== details.totalMarks
                      ? `Target: ${details.totalMarks} marks`
                      : "Marks match target"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ---- Step 2: Review ---- */}
          {step === 2 && (
            <Card>
              <h2 className="font-bold text-slate-900 text-base mb-1">
                Review Assessment
              </h2>
              <p className="text-sm text-slate-400 mb-5">
                Confirm the details before saving
              </p>

              <div className="space-y-0 divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {[
                  { label: "Title", value: details.title },
                  {
                    label: "Course",
                    value: selectedCourse
                      ? `${selectedCourse.code} — ${selectedCourse.name}`
                      : "—",
                  },
                  { label: "Duration", value: `${details.duration} minutes` },
                  { label: "Total Marks", value: details.totalMarks },
                  {
                    label: "Questions",
                    value: `${questions.length} (${questions.filter((q) => q.type === "OBJECTIVE").length} MCQ, ${questions.filter((q) => q.type === "SUBJECTIVE").length} Essay)`,
                  },
                  {
                    label: "Question Marks",
                    value: totalQuestionMarks,
                  },
                  {
                    label: "Start Time",
                    value: details.startTime
                      ? new Date(details.startTime).toLocaleString()
                      : "Not set",
                  },
                  {
                    label: "End Time",
                    value: details.endTime
                      ? new Date(details.endTime).toLocaleString()
                      : "Not set",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center px-4 py-3 text-sm"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>

              {totalQuestionMarks !== details.totalMarks && (
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mt-4">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    Question marks ({totalQuestionMarks}) don&apos;t match the total marks
                    ({details.totalMarks}). You can still save and fix this later.
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-4">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <p className="mt-4 text-xs text-slate-400">
                The assessment will be saved as{" "}
                <span className="font-semibold text-slate-600">DRAFT</span>. You
                can review, edit, and publish it when ready.
              </p>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-1">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ChevronLeft size={15} />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!stepValid[step]}
              >
                Continue
                <ChevronRight size={15} />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={saving}>
                <Check size={15} />
                Save Assessment
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
