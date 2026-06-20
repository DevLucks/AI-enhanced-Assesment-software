import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export interface GradingResult {
  score: number;
  maxScore: number;
  confidence: number;
  feedback: string;
}

export async function gradeSubjectiveAnswer(
  questionText: string,
  modelAnswer: string,
  studentAnswer: string,
  keywords: { keyword: string; weight: number }[],
  maxMarks: number
): Promise<GradingResult> {
  const keywordList =
    keywords.length > 0
      ? keywords
          .map((k) => `- "${k.keyword}" (weight: ${k.weight})`)
          .join("\n")
      : "No specific keywords defined.";

  const prompt = `You are an academic examiner grading a student's response. Be fair but strict.

QUESTION:
${questionText}

MODEL ANSWER (what a perfect response looks like):
${modelAnswer}

GRADING KEYWORDS (key concepts that should appear, with weights 0-1):
${keywordList}

STUDENT'S ANSWER:
${studentAnswer}

GRADING INSTRUCTIONS:
- Maximum marks available: ${maxMarks}
- Evaluate semantic similarity between student answer and model answer
- Check if key concepts from the keywords list are addressed (higher weight = more important)
- Award partial marks for partially correct answers
- Be strict: vague or irrelevant answers should score low
- An empty or completely off-topic answer scores 0

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "score": <number between 0 and ${maxMarks}>,
  "confidence": <number between 0 and 1 representing your confidence in this grade>,
  "feedback": "<one or two sentences of constructive feedback for the student>"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini returned invalid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    score: Math.min(Math.max(Number(parsed.score), 0), maxMarks),
    maxScore: maxMarks,
    confidence: Math.min(Math.max(Number(parsed.confidence), 0), 1),
    feedback: String(parsed.feedback),
  };
}
