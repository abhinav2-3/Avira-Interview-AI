"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import {
  EvaluationResponse,
  getInterviewEvaluation,
} from "@/lib/client/interviewAPIs";

// Mock Transcript for display
const mockTranscript: any = [
  {
    role: "interviewer",
    text: "Welcome Abhinav. Can you tell me about your experience with React?",
  },
  {
    role: "candidate",
    text: "I have been working with React for over 2 years, building scalable web applications.",
  },
  {
    role: "interviewer",
    text: "Great. Can you explain how the useEffect hook works and its common use cases?",
  },
  { role: "candidate", text: "..." },
  { role: "interviewer", text: "Are you there? I was asking about useEffect." },
  {
    role: "candidate",
    text: "I'm sorry, I'm having some trouble recalling the specifics right now.",
  },
];

export default function App({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [showCreateAccountPrompt, setShowCreateAccountPrompt] = useState(false); // New state variable
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        setShowCreateAccountPrompt(false); // Reset on new fetch
        const result = await getInterviewEvaluation(sessionId);
        setData(result);
        // console.log("evaluation result", result);
        if (!result.success) {
          if (result.statusCode === 400) {
            setError(
              "You need an account to access this dashboard. Please log in or create one.",
            );
            setShowCreateAccountPrompt(true);
          } else {
            setError(result.message || "Failed to load evaluation.");
          }
          return;
        }
        console.log("evaluation result", result);
        setError(null);
      } catch (err: any) {
        console.error("Evaluation fetch error:", err);
        setError(
          err.message ||
            "An unexpected error occurred while fetching the evaluation.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [sessionId]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleLoginRedirect = () => {
    router.push(`/login?callbackUrl=/dashboard/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <Loader2 className="w-10 h-10 animate-spin mb-6 text-white/50" />
          <p className="text-sm font-mono tracking-widest uppercase opacity-60">
            Analyzing Candidate Data
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">
            {showCreateAccountPrompt ? "Access Denied" : "Evaluation Failed"}
          </h2>
          <p className="text-white/60 text-sm mb-6">{error}</p>
          {showCreateAccountPrompt ? (
            <button
              onClick={handleLoginRedirect}
              className="w-full py-3 bg-white text-black font-medium rounded-xl cursor-pointer hover:bg-white/90 transition-colors"
            >
              Login or Create Account
            </button>
          ) : (
            <button
              onClick={handleReload}
              className="w-full py-3 bg-white text-black font-medium rounded-xl cursor-pointer hover:bg-white/90 transition-colors"
            >
              Retry Analysis
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  if (!data || !data.evaluation || !data.user || !data.success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-white/50 font-mono text-sm">
          {data?.message || "Evaluation not found"}
        </p>
      </div>
    );
  }

  const { evaluation, user } = data;

  const chartData = [
    { subject: "Technical", A: evaluation.technicalDepth, fullMark: 100 },
    { subject: "Communication", A: evaluation.communication, fullMark: 100 },
    { subject: "Problem Solving", A: evaluation.problemSolving, fullMark: 100 },
    { subject: "Confidence", A: evaluation.confidence, fullMark: 100 },
  ];

  const overallScore = Math.round(
    (evaluation.technicalDepth +
      evaluation.communication +
      evaluation.problemSolving +
      evaluation.confidence) /
      4,
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-16"
        >
          <button className="group flex items-center gap-2 text-xs font-mono uppercase cursor-pointer tracking-widest text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Interviews
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs font-mono uppercase cursor-pointer tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </motion.nav>

        {/* Header Section */}
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-baseline gap-4 mb-2">
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter">
                {user.name}
              </h1>
              <span className="text-xs font-mono px-2 py-1 bg-white/10 rounded uppercase tracking-tighter opacity-50">
                {user.USRID}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-mono text-white/40 uppercase tracking-widest">
              <span>{user.role}</span>
              <span className="hidden md:inline">•</span>
              <span>{user.experience} Experience</span>
              <span className="hidden md:inline">•</span>
              <span>{user.difficulty} Level</span>
            </div>
          </motion.div>
        </header>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Summary Card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 className="w-32 h-32" />
            </div>

            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-8">
              Executive Summary
            </h3>
            <p className="text-xl md:text-2xl font-light leading-relaxed mb-12 text-white/90">
              {evaluation.summary}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/10">
              <div>
                <span className="block text-4xl font-light mb-1">
                  {overallScore}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Overall Fit
                </span>
              </div>
              <div>
                <span className="block text-4xl font-light mb-1">
                  {evaluation.technicalDepth}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Technical
                </span>
              </div>
              <div>
                <span className="block text-4xl font-light mb-1">
                  {evaluation.communication}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Communication
                </span>
              </div>
              <div>
                <span className="block text-4xl font-light mb-1">
                  {evaluation.problemSolving}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Solving
                </span>
              </div>
            </div>
          </motion.section>

          {/* Radar Chart Card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center min-h-[400px]"
          >
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-8 self-start">
              Competency Map
            </h3>
            <div className="w-full h-full flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={chartData}
                >
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: "rgba(255,255,255,0.4)",
                      fontSize: 10,
                      fontWeight: 300,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Candidate"
                    dataKey="A"
                    stroke="#ffffff"
                    strokeWidth={1}
                    fill="#ffffff"
                    fillOpacity={0.15}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-8 pb-4 border-b border-white/10">
              <CheckCircle2 className="w-4 h-4 text-white/60" /> Core Strengths
            </h3>
            <ul className="space-y-6">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex gap-4 group">
                  <span className="text-white/20 font-mono text-xs mt-1">
                    0{i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-white/70 group-hover:text-white transition-colors">
                    {s}
                  </p>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-8 pb-4 border-b border-white/10">
              <XCircle className="w-4 h-4 text-white/60" /> Areas for Growth
            </h3>
            <ul className="space-y-6">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-4 group">
                  <span className="text-white/20 font-mono text-xs mt-1">
                    0{i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-white/70 group-hover:text-white transition-colors">
                    {w}
                  </p>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Transcript Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="border border-white/10 rounded-3xl overflow-hidden"
        >
          <details className="group">
            <summary className="flex items-center justify-between p-8 cursor-pointer bg-white/5 hover:bg-white/[0.08] transition-all">
              <div className="flex items-center gap-4">
                <Eye className="w-5 h-5 text-white/40" />
                <span className="text-sm font-mono uppercase tracking-widest">
                  Interview Transcript
                </span>
              </div>
              <motion.div
                animate={{ rotate: 0 }}
                className="group-open:rotate-180 transition-transform"
              >
                <Download className="w-4 h-4 text-white/20" />
              </motion.div>
            </summary>
            <div className="p-8 md:p-12 bg-black border-t border-white/10 max-h-[500px] overflow-y-auto">
              <div className="space-y-8">
                {mockTranscript.map((t, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4"
                  >
                    <div className="md:col-span-2">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest ${t.role === "interviewer" ? "text-white/30" : "text-white/60"}`}
                      >
                        {t.role}
                      </span>
                    </div>
                    <div className="md:col-span-10">
                      <p
                        className={`text-sm leading-relaxed ${t.role === "candidate" ? "text-white italic" : "text-white/60"}`}
                      >
                        {t.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </motion.section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
            Generated on{" "}
            {new Intl.DateTimeFormat("en-GB").format(
              new Date(evaluation.createdAt),
            )}
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-[10px] font-mono text-white/20 hover:text-white uppercase tracking-widest transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-[10px] font-mono text-white/20 hover:text-white uppercase tracking-widest transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
