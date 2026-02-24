import { NextRequest, NextResponse } from "next/server";
import Document from "@/models/documentModel";
import InterviewSession from "@/models/interviewModel";
import InterviewEngine from "@/lib/gemini/interviewEngine";
import connectDB from "@/lib/server/mongodb";
import { v4 as uuidv4 } from "uuid";
import { ISetting } from "@/lib/types";
import User from "@/models/userModel";

// ── 2. Start Interview ──

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── 1. Validate request ────
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
        { status: 400 }
      );
    }

    // ── 2. Load user ───
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ── 3. Load documents & create session (parallel) ───
    const [documents, session] = await Promise.all([
      Document.find({ userId: user._id }).lean(),
      InterviewSession.create({
        userId: user._id,
        status: "ongoing",
        maxQuestion: 5,
        currentQuestion: 1,
        qaHistory: [],
        startedAt: new Date(),
      }),
    ]);

    // ── 4. Attach resume & JD to session ───
    const resumeDoc = documents.find((d) => d.type === "Resume") || null;
    const jdDoc = documents.find((d) => d.type === "JD") || null;

    if (resumeDoc || jdDoc) {
      session.resumeId = resumeDoc?._id;
      session.jdId = jdDoc?._id;
    }

    // ── 5. Generate first question ───
    const settings: ISetting = {
      candidateName: user.name,
      position: user.role,
      language: user.language,
      difficulty: user.difficulty,
    };

    const engine = new InterviewEngine(session);
    const firstQuestion = await engine.generateFirstQuestion(
      resumeDoc?.parsed || null,
      jdDoc?.parsed || null,
      settings
    );

    // ── 6. Save session with first question ───
    session.qaHistory = [
      {
        questionId: firstQuestion.questionId || uuidv4(),
        question: firstQuestion.questionText,
        createdAt: new Date(),
      },
    ];
    session.systemPrompt = engine.session.systemPrompt;

    await session.save();

    return NextResponse.json(
      {
        success: true,
        sessionId: session._id,
        question: firstQuestion.questionText,
        questionId: firstQuestion.questionId,
        progress: {
          current: user.limits.durationUsed,
          total: user.limits.maxDurationPerDay,
          remaining: user.limits.maxDurationPerDay - user.limits.durationUsed,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in /interview/start:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}