import { StartResponse, NextResponse, SubmitUserResponse } from "../types";

/**
 * Start a new interview session
 * Backend creates session and returns first question
 */

const dummy = {
  success: true,
  sessionId: "123234",
  question: "What is Capital of India",
  questionId: "12345",
  progress: {
    current: 4,
    total: 40,
    remaining: 36,
  },
  end: false,
};
const dummy2 = {
  success: true,
  sessionId: "1232345",
  question: "What is Capital of Uttar Pradesh",
  questionId: "1234",
  progress: {
    current: 4,
    total: 40,
    remaining: 36,
  },
  end: false,
};

export async function startInterviewSession(
  userId: string,
): Promise<StartResponse> {
  // console.warn("[MOCK] startInterviewSession returning dummy data");

  // Simulate network latency (optional but recommended)
  // await new Promise((res) => setTimeout(res, 600));
  // return dummy;
  const response = await fetch("/api/interview/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const data: StartResponse = await response.json();
  if (response.status === 500) {
    throw new Error(data.message || "Failed to submit answer");
  }

  return data;
}

/**
 * Submit user answer and get next question
 * Backend evaluates answer and returns next question or ends session
 */
export async function submitAnswerAndGetNext(params: {
  userId?: string;
  sessionId: string;
  questionId: string;
  answerText: string;
  end?: boolean;
}): Promise<NextResponse> {
  // console.warn("[MOCK] submitAnswerAndGetNext returning dummy data");

  // Simulate network latency (optional but recommended)
  // await new Promise((res) => setTimeout(res, 600));
  // return dummy2;
  const response = await fetch("/api/interview/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data: NextResponse = await response.json();
  if (response.status === 500) {
    throw new Error(data.message || "Failed to submit answer");
  }

  return data;
}

const dummySubmitUserResponse: SubmitUserResponse = {
  success: true,
  userId: "dummy-user-123",
  resumeId: "dummy-resume-456",
  jdId: "dummy-jd-789",
};

export async function submitUserResume(
  formData: FormData,
): Promise<SubmitUserResponse> {
  // console.warn("[MOCK] submitUserResume returning dummy data");

  // Simulate network latency (optional but recommended)
  // await new Promise((res) => setTimeout(res, 600));

  // return dummySubmitUserResponse;

  // REAL BACKEND CALL

  const response = await fetch("/api/users", {
    method: "POST",
    body: formData,
  });

  const data: SubmitUserResponse = await response.json();

  if (response.status === 500) {
    throw new Error(data.message || "Failed to submit answer");
  }

  return data;
}


export async function getInterviewEvaluation(sessionId: string): Promise<EvaluationResponse> {
  // ── DUMMY DATA (comment out real call and uncomment this to avoid API hits) ──
  // await new Promise((res) => setTimeout(res, 800));
  // return dummyEvaluationResponse;

  // ── REAL API CALL ─────────────────────────────────────────────────────────────
  const response = await fetch(`/api/interview/evaluate/${sessionId}`, { method: "GET" });

  const data: EvaluationResponse = await response.json();

  if (!response.ok) {
    return { ...data, statusCode: response.status };
  }

  return data;
}

// ── Dummy Data ────────────────────────────────────────────────────────────────
const dummyEvaluationResponse: EvaluationResponse = {
  success: true,
  evaluation: {
    _id: "699923c514c1c29c78450c3b",
    interviewId: "69980c1ad028a3904eb53b07",
    communication: 50,
    technicalDepth: 70,
    problemSolving: 40,
    confidence: 30,
    summary:
      "The candidate's resume presents a strong background in React and Next.js development, with practical experience and relevant projects. However, the interview transcript indicates a complete failure to answer the initial technical question regarding the `useEffect` hook.",
    strengths: [
      "Strong practical experience with React and Next.js, as demonstrated by their resume projects and work history.",
      "Proficiency in modern front-end technologies (JavaScript, HTML/CSS, TailwindCSS) and web application development.",
      "Experience with CI/CD pipelines and cloud deployment (AWS, Jenkins), indicating a broader understanding of full-stack operations.",
    ],
    weaknesses: [
      "Failed to provide any answer to a fundamental technical question about the `useEffect` hook in React.",
      "Lack of demonstrable communication skills during the interview, as no verbal response was given.",
      "Unable to demonstrate technical depth or problem-solving ability due to the absence of an answer.",
    ],
    createdAt: "2026-02-21T03:17:25.729Z",
    updatedAt: "2026-02-21T03:17:25.729Z",
    __v: 0,
  },
  user: {
    _id: "69980c14d028a3904eb53b00",
    USRID: "USR00008",
    name: "Aniruddha",
    email: "aniruddha.@example.com",
    userType: "FREE",
    role: "Frontend Engineering (React)",
    experience: "0",
    difficulty: "Mid-Level",
    language: "English",
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface EvaluationResponse {
  success: boolean;
  message?: string;
  statusCode?: number; // Add this line
  evaluation?: {
    _id: string;
    interviewId: string;
    communication: number;
    technicalDepth: number;
    problemSolving: number;
    confidence: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  user?: {
    _id: string;
    USRID: string;
    name: string;
    email: string;
    userType: string;
    role: string;
    experience: string;
    difficulty: string;
    language: string;
  };
}