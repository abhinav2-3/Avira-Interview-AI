"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Chromium, Loader } from "lucide-react"; // Importing an icon for Google

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const callbackUrl = searchParams.get("callbackUrl") || "/"; // Get callbackUrl from params, default to "/"

  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  if (status === "loading") {
    return (
      <div className="container min-h-screen flex items-center justify-center bg-black">
        <div className="text-white font-mono animate-pulse">
          Initializing...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-950 text-[#FAFAFA] overflow-hidden p-4">
      {/* Subtle background effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000" />

      <div className="relative z-10 p-8 border border-white/10 rounded-2xl bg-gradient-to-br from-neutral-900/70 to-neutral-950/70 backdrop-blur-xl w-full max-w-md flex flex-col items-center text-center shadow-2xl">
        <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-3">
          Avira AI
        </h1>
        <p className="text-neutral-400 text-sm mb-10 font-light uppercase tracking-[0.2em]">
          Access Protocol
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="group relative w-full py-3.5 bg-white text-black cursor-pointer font-semibold rounded-full transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden shadow-lg hover:shadow-xl"
        >
          <span className="relative z-10 flex items-center gap-3">
            <Chromium className="w-5 h-5" /> Continue with Google
          </span>
          <div className="absolute inset-0 bg-neutral-100 translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
        </button>

        <p className="mt-8 text-xs text-neutral-600 font-mono uppercase tracking-[0.15em]">
          Unlock advanced features and personalized insights.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader />}>
      <LoginContent />
    </Suspense>
  );
}
