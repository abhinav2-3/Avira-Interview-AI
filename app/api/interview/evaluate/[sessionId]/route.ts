import { evaluationPrompt } from "@/lib/constants";
import { callLLM } from "@/lib/gemini/llmServices";
import connectDB, {
  DocumentModel,
  Evaluation,
  InterviewModel,
} from "@/lib/server/mongodb";
import { NextResponse } from "next/server";

// ── 1. Evaluate Candidate ───

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  try {
    await connectDB();

    // ── 1. Load & validate session ───
    const session = await InterviewModel.findById(sessionId)
      .populate({ path: "userId", select: "-limits -updatedAt -__v" })
      .lean();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found, please try again" },
        { status: 404 },
      );
    }

    if ((session.userId as any).userType === "GUEST") {
      return NextResponse.json(
        {
          success: false,
          message: "Please create an account to view your evaluation",
        },
        { status: 400 },
      );
    }

    // ── 2. Return existing evaluation if already generated ──
    const existingEvaluation = await Evaluation.findOne({
      interviewId: sessionId,
    }).lean();
    if (existingEvaluation) {
      return NextResponse.json(
        { success: true, evaluation: existingEvaluation, user: session.userId },
        { status: 200 },
      );
    }

    // ── 3. Load documents (parallel) ──
    const [resume, jd] = await Promise.all([
      DocumentModel.findById(session.resumeId).select("parsed").lean(),
      DocumentModel.findById(session.jdId).select("parsed").lean(),
    ]);

    // ── 4. Build transcript ───
    const transcript = session.qaHistory.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      answer: q.answer || "",
    }));

    // ── 5. Generate & parse evaluation via LLM ───
    const prompt = evaluationPrompt(transcript, resume?.parsed, jd?.parsed);
    const text = await callLLM(prompt);
    const clean = text?.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(clean as string);

    // ── 6. Persist evaluation ─────
    const savedEvaluation = await Evaluation.create({
      interviewId: sessionId,
      ...evaluation,
    });

    return NextResponse.json(
      { success: true, evaluation: savedEvaluation, user: session.userId },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Error in /interview/evaluate/:sessionId", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}
