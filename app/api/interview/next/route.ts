import { NextRequest, NextResponse } from "next/server";
import Document from "@/models/documentModel";
import InterviewSession from "@/models/interviewModel";
import InterviewEngine from "@/lib/gemini/interviewEngine";
import connectDB from "@/lib/server/mongodb";
import { v4 as uuidv4 } from "uuid";
import User from "@/models/userModel";
import { checkAndUpdateDurationMiddleware } from "@/lib/checkLimits";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── 1. Middleware: auth + limit check ───
    const limitCheck = await checkAndUpdateDurationMiddleware(req);
    if (limitCheck instanceof NextResponse) return limitCheck;

    const { user, sessionId, questionId, answerText, end = false } = limitCheck;

    // ── 2. Validate required fields ─────────
    if (!sessionId || !questionId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: sessionId or questionId" },
        { status: 400 }
      );
    }

    // ── 3. Load & validate session ─────────
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Session already completed" },
        { status: 400 }
      );
    }

    // ── 4. Check session time limit ──────────
    const elapsedSeconds = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    const isTimeLimitExceeded = elapsedSeconds >= user.limits.maxDurationPerDay;

    if (isTimeLimitExceeded) {
      await Promise.all([
        User.findByIdAndUpdate(user._id, {
          $set: { "limits.durationUsed": user.limits.maxDurationPerDay },
        }),
        InterviewSession.findByIdAndUpdate(sessionId, {
          $set: { status: "completed", endedAt: new Date() },
        }),
      ]);

      return NextResponse.json(
        { success: false, message: "Session time limit reached", end: true },
        { status: 403 }
      );
    }

    // ── 5. Update current answer in history ─────
    const qaHistory = session.qaHistory || [];
    const questionIndex = qaHistory.findIndex(
      (q: any) => String(q.questionId || q._id) === String(questionId)
    );

    if (questionIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Question not found in session history" },
        { status: 404 }
      );
    }

    qaHistory[questionIndex].answer = answerText;
    qaHistory[questionIndex].updatedAt = new Date();

    // ── 6. Handle session end ──────────────────
    if (end) {
      session.status = "completed";
      session.qaHistory = qaHistory;
      session.contextSummary = buildContextSummary(qaHistory);

      await Promise.all([
        session.save(),
        User.findByIdAndUpdate(user._id, {
          $set: { "limits.durationUsed": elapsedSeconds },
        }),
      ]);

      const transcript = buildTranscript(qaHistory);

      return NextResponse.json(
        {
          success: true,
          end: true,
          questionId: uuidv4(),
          question: "Thank you for your time. The interview is now complete.",
          transcript,
          sessionComplete: true,
          completionReason: "user_ended",
        },
        { status: 200 }
      );
    }

    // ── 7. Load documents for AI context (parallel) ──
    const [resumeDoc, jdDoc] = await Promise.all([
      session.resumeId ? Document.findById(session.resumeId) : null,
      session.jdId ? Document.findById(session.jdId) : null,
    ]);

    // ── 8. Generate next question via AI engine ──────
    const engine = new InterviewEngine(session);
    const parsed = await engine.processAnswerAndGenerateNext(
      session,
      answerText,
      resumeDoc?.parsed,
      jdDoc?.parsed,
      { position: session.systemPrompt, isQuestionEnd: false }
    );

    if (!parsed.nextQuestion?.questionText) {
      return NextResponse.json(
        {
          success: true,
          end: true,
          question: "There is something problem in this session. Please restart.",
          questionId: uuidv4(),
          topic: "General",
          difficulty: "No",
        },
        { status: 200 }
      );
    }

    const nextQuestion = parsed.nextQuestion;

    // ── 9. Append next question & update session ─────
    qaHistory.push({
      questionId: nextQuestion.questionId || uuidv4(),
      question: nextQuestion.questionText,
      createdAt: new Date(),
    });

    session.qaHistory = qaHistory;
    session.currentQuestion = (session.currentQuestion || qaHistory.length - 1) + 1;
    session.contextSummary = buildContextSummary(qaHistory);

    const [updatedUser] = await Promise.all([
      User.findByIdAndUpdate(
        user._id,
        { $set: { "limits.durationUsed": elapsedSeconds } },
        { new: true }
      )
        .select("limits")
        .lean(),
      session.save(),
    ]);

    // transcript excludes the unanswered last question
    const transcript = buildTranscript(qaHistory.slice(0, -1));

    return NextResponse.json(
      {
        success: true,
        end: false,
        question: nextQuestion.questionText,
        questionId: nextQuestion.questionId,
        topic: nextQuestion.topic,
        difficulty: nextQuestion.difficulty,
        progress: {
          current: updatedUser?.limits.durationUsed,
          total: updatedUser?.limits.maxDurationPerDay,
          remaining: (updatedUser?.limits.maxDurationPerDay || 0) - elapsedSeconds,
        },
        transcript,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in /interview/next:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Helpers ─────

function buildContextSummary(qaHistory: any[]): string {
  return qaHistory
    .slice(-6)
    .map((r: any) => `Q:${r.question} A:${r.answer || ""}`)
    .join("\n");
}

function buildTranscript(qaHistory: any[]) {
  return qaHistory.map((q) => ({
    questionId: q.questionId,
    question: q.question,
    createdAt: q.createdAt,
    answer: q.answer || "",
    updatedAt: q.updatedAt,
  }));
}