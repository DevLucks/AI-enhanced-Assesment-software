import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { GradeCircle } from "@/components/ui/Badge";
import { CheckCircle2, XCircle, ArrowLeft, Bot, Minus } from "lucide-react";

export default async function ResultReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const studentId = session!.user.id;
  const { id } = await params;

  const result = await prisma.result.findFirst({
    where: { id, submission: { studentId } },
    include: {
      submission: {
        include: {
          assessment: {
            include: {
              course: { select: { name: true, code: true } },
              questions: {
                orderBy: { order: "asc" },
                include: {
                  options: { select: { id: true, label: true, text: true, isCorrect: true } },
                },
              },
            },
          },
          answers: true,
        },
      },
    },
  });

  if (!result) notFound();

  const { submission } = result;
  const { assessment } = submission;
  const answerMap = new Map(submission.answers.map((a) => [a.questionId, a]));
  const pct =
    assessment.totalMarks > 0
      ? Math.round((result.totalMarks / assessment.totalMarks) * 100)
      : 0;

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC] min-h-screen">
      <Header
        title="Answer Review"
        subtitle={`${assessment.title} · ${assessment.course.code}`}
      />
      <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Back link */}
        <Link
          href="/student/results"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Results
        </Link>

        {/* Score summary card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {assessment.course.name}
            </p>
            <h2 className="text-xl font-bold text-slate-900 font-heading mt-0.5">
              {assessment.title}
            </h2>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-slate-600">
                <span className="font-semibold">{result.objectiveMarks.toFixed(1)}</span>
                <span className="text-slate-400"> MCQ</span>
              </span>
              <span className="text-slate-600">
                <span className="font-semibold">{result.subjectiveMarks.toFixed(1)}</span>
                <span className="text-slate-400"> Essay</span>
              </span>
              <span className="text-slate-600">
                <span className="font-semibold">{result.totalMarks.toFixed(1)}</span>
                <span className="text-slate-400">/{assessment.totalMarks} total</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900 font-heading">{pct}%</p>
            </div>
            <GradeCircle grade={result.grade} />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {assessment.questions.map((q, idx) => {
            const answer = answerMap.get(q.id);
            const selectedOption = q.options.find((o) => o.id === answer?.selectedOption);
            const correctOption = q.options.find((o) => o.isCorrect);
            const isCorrect =
              q.type === "OBJECTIVE" ? selectedOption?.isCorrect === true : null;
            const marksAwarded = answer?.marksAwarded ?? null;
            const notAnswered = q.type === "OBJECTIVE"
              ? !answer?.selectedOption
              : !answer?.answerText;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border shadow-sm p-6 ${
                  q.type === "OBJECTIVE"
                    ? isCorrect
                      ? "border-emerald-200"
                      : notAnswered
                      ? "border-slate-100"
                      : "border-red-200"
                    : "border-slate-100"
                }`}
              >
                {/* Question header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">
                        {q.type === "OBJECTIVE" ? "Multiple Choice" : "Essay / Short Answer"} · {q.marks} mark{q.marks !== 1 ? "s" : ""}
                      </p>
                      <p className="text-slate-800 font-medium leading-relaxed">{q.text}</p>
                    </div>
                  </div>

                  {/* Marks badge */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {marksAwarded !== null ? (
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        marksAwarded === q.marks
                          ? "bg-emerald-50 text-emerald-700"
                          : marksAwarded > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {marksAwarded.toFixed(1)}/{q.marks}
                      </span>
                    ) : null}
                    {q.type === "OBJECTIVE" &&
                      (notAnswered ? (
                        <Minus size={20} className="text-slate-300" />
                      ) : isCorrect ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <XCircle size={20} className="text-red-500" />
                      ))}
                  </div>
                </div>

                {/* MCQ options */}
                {q.type === "OBJECTIVE" && (
                  <div className="mt-4 space-y-2 ml-10">
                    {q.options.map((opt) => {
                      const isSelected = opt.id === answer?.selectedOption;
                      const isRight = opt.isCorrect;

                      let optStyle = "border-slate-100 bg-slate-50 text-slate-600";
                      if (isSelected && isRight) optStyle = "border-emerald-300 bg-emerald-50 text-emerald-800";
                      else if (isSelected && !isRight) optStyle = "border-red-300 bg-red-50 text-red-800";
                      else if (!isSelected && isRight) optStyle = "border-emerald-200 bg-emerald-50/60 text-emerald-700";

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${optStyle}`}
                        >
                          <span className="font-bold w-5 flex-shrink-0">{opt.label}.</span>
                          <span className="flex-1">{opt.text}</span>
                          {isSelected && isRight && (
                            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                          )}
                          {isSelected && !isRight && (
                            <XCircle size={15} className="text-red-600 flex-shrink-0" />
                          )}
                          {!isSelected && isRight && (
                            <span className="text-xs font-medium text-emerald-600 flex-shrink-0">Correct</span>
                          )}
                        </div>
                      );
                    })}

                    {notAnswered && (
                      <p className="text-xs text-slate-400 italic mt-1">Not answered</p>
                    )}
                  </div>
                )}

                {/* Subjective answer */}
                {q.type === "SUBJECTIVE" && (
                  <div className="mt-4 ml-10 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Your Answer</p>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed min-h-[3rem]">
                        {answer?.answerText || (
                          <span className="text-slate-400 italic">Not answered</span>
                        )}
                      </div>
                    </div>

                    {q.modelAnswer && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Model Answer</p>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-800 leading-relaxed">
                          {q.modelAnswer}
                        </div>
                      </div>
                    )}

                    {answer?.aiFeedback && (
                      <div className="flex gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                        <Bot size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-indigo-600 mb-0.5">AI Feedback</p>
                          <p className="text-sm text-indigo-800 leading-relaxed">{answer.aiFeedback}</p>
                          {answer.aiConfidence !== null && answer.aiConfidence !== undefined && (
                            <p className="text-xs text-indigo-400 mt-1">
                              Confidence: {Math.round(answer.aiConfidence * 100)}%
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
