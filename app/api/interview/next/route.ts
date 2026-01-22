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
    // Check limits first
    await connectDB();
    const limitCheck = await checkAndUpdateDurationMiddleware(req);
    if (limitCheck instanceof NextResponse) return limitCheck;
    const { user, sessionId, questionId, answerText, end = false } = limitCheck;

    // const {
    //   userId,
    //   sessionId,
    //   questionId,
    //   answerText,
    //   end = false,
    // } = await req.json();

    // Validation
    if (!sessionId || !questionId || !answerText) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: userId, sessionId, questionId, or answerText",
        },
        { status: 400 },
      );
    }

    // Fetch user
    // const user = await User.findById(userId);
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, message: "User not found" },
    //     { status: 404 }
    //   );
    // }

    // Load session
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 },
      );
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Session already completed" },
        { status: 400 },
      );
    }

    // Calculate elapsed time in SECONDS
    const startedAtTime = new Date(session.startedAt).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startedAtTime) / 1000);

    // Check if exceeded limit
    if (elapsedSeconds >= user.limits.maxDurationPerDay) {
      // Parallel updates
      await Promise.all([
        User.findByIdAndUpdate(user._id, {
          $set: { "limits.durationUsed": user.limits.maxDurationPerDay },
        }),
        InterviewSession.findByIdAndUpdate(sessionId, {
          $set: { status: "completed", endedAt: new Date() },
        }),
      ]);

      return NextResponse.json(
        {
          success: false,
          message: "Session time limit reached",
          end: true,
        },
        { status: 403 },
      );
    }

    // Load documents only if needed (parallel)
    const [resumeDoc, jdDoc] = await Promise.all([
      session.resumeId ? Document.findById(session.resumeId) : null,
      session.jdId ? Document.findById(session.jdId) : null,
    ]);

    // Update answer in history
    const qaHistory = session.qaHistory || [];
    const questionIndex = qaHistory.findIndex(
      (q: any) => String(q.questionId || q._id) === String(questionId),
    );

    if (questionIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Question not found in session history" },
        { status: 404 },
      );
    }

    qaHistory[questionIndex].answer = answerText;
    qaHistory[questionIndex].updatedAt = new Date();

    // Check if session should end
    const currentQuestionNumber = session.currentQuestion || qaHistory.length;
    // const maxQuestions = session.maxQuestion || 10;
    // const isQuestionEnd = end || currentQuestionNumber >= maxQuestions;

    // Handle session end
    if (end) {
      session.status = "completed";
      session.qaHistory = qaHistory;

      // Update context
      const recent = qaHistory.slice(-6);
      session.contextSummary = recent
        .map((r: any) => `Q:${r.question} A:${r.answer || ""}`)
        .join("\n");

      // Generate closing message
      // const engine = new InterviewEngine(session);
      // const parsed = await engine.processAnswerAndGenerateNext(
      //   session,
      //   answerText,
      //   resumeDoc?.parsed,
      //   jdDoc?.parsed,
      //   { position: session.systemPrompt, isQuestionEnd: true }
      // );

      const nextQuestion =
        "Thank you for your time. The interview is now complete.";

      // Parallel save and update
      await Promise.all([
        session.save(),
        User.findByIdAndUpdate(user._id, {
          $set: { "limits.durationUsed": elapsedSeconds },
        }),
      ]);

      // Build transcript
      const transcript = qaHistory.map((q) => ({
        questionId: q.questionId,
        question: q.question,
        createdAt: q.createdAt,
        answer: q.answer || "",
        updatedAt: q.updatedAt,
      }));

      return NextResponse.json({
        success: true,
        end: true,
        questionId: uuidv4(),
        nextQuestion,
        transcript,
        sessionComplete: true,
        completionReason: end ? "user_ended" : "max_questions",
      });
    }

    // Normal flow: Generate next question
    const engine = new InterviewEngine(session);
    const parsed = await engine.processAnswerAndGenerateNext(
      session,
      answerText,
      resumeDoc?.parsed,
      jdDoc?.parsed,
      { position: session.systemPrompt, isQuestionEnd: false },
    );

    // Validate response
    if (!parsed.nextQuestion?.questionText) {
      return NextResponse.json(
        {
          success: true,
          end: true,
          nextQuestion:
            "There is something problem in this session. Please restart.",
          questionId: uuidv4(),
          topic: "General",
          difficulty: "No",
        },
        { status: 500 },
      );
    }

    const nextQuestion = parsed.nextQuestion;

    // Add next question to history
    qaHistory.push({
      questionId: nextQuestion.questionId || uuidv4(),
      question: nextQuestion.questionText,
      createdAt: new Date(),
    });

    // Update session
    session.qaHistory = qaHistory;
    session.currentQuestion = currentQuestionNumber + 1;

    // Update context
    const recent = qaHistory.slice(-6);
    session.contextSummary = recent
      .map((r: any) => `Q:${r.question} A:${r.answer || ""}`)
      .join("\n");

    // Parallel save and update usage
    const [newUser] = await Promise.all([
      User.findByIdAndUpdate(user._id, {
        $set: { "limits.durationUsed": elapsedSeconds },
      })
        .select("limits")
        .lean(),
      session.save(),
    ]);

    // Build transcript (exclude unanswered question)
    const transcript = qaHistory.slice(0, -1).map((q) => ({
      questionId: q.questionId,
      question: q.question,
      createdAt: q.createdAt,
      answer: q.answer || "",
      updatedAt: q.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        question: nextQuestion.questionText,
        questionId: nextQuestion.questionId,
        topic: nextQuestion.topic,
        difficulty: nextQuestion.difficulty,
        progress: {
          current: newUser?.limits.durationUsed,
          total: newUser?.limits.maxDurationPerDay,
          remaining:
            (newUser?.limits.maxDurationPerDay || 0) - user.limits.durationUsed,
        },
        transcript,
        end: false,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Error in /interview/next:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
