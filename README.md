<div align="center">

# 🤖 Avira.ai

### AI-Powered Technical Interview Platform

**Practice smarter. Get hired faster.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-orange?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)

</div>

---

## ✨ What is Avira.ai?

Avira.ai is an immersive, AI-driven mock interview platform featuring **Avira** — a holographic AI interviewer that conducts real-world-style technical interviews tailored to *your* resume and *your* target job.

No generic questions. No one-size-fits-all practice. Just a realistic, personalized, and pressure-free interview experience.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🧠 **(AI Interviewer)** | Warm, professional AI interviewer with natural conversational style |
| 📄 **Contextual Questioning** | Parses your Resume + Job Description to generate role-specific questions |
| 📈 **Adaptive Difficulty** | Adjusts question complexity based on your previous answers in real-time |
| 🌀 **Holographic 3D Avatar** | Interactive Three.js avatar that reacts to audio and interview phases |
| 🎙️ **Voice Interaction** | Full STT & TTS support — speak naturally, no typing required |
| 📊 **Automated Evaluation** | Detailed post-interview breakdown of strengths and improvement areas |
| 🔁 **Session Recovery** | Resume interrupted interviews — full state persisted in MongoDB |

---

## 🛠️ Tech Stack

```
Frontend      → Next.js 16 (App Router), TypeScript, Tailwind CSS v4
Animation     → Framer Motion, Lucide React
3D Rendering  → Three.js, React Three Fiber
Backend       → Node.js, Next.js API Routes
Database      → MongoDB + Mongoose
Auth          → NextAuth.js (Google OAuth)
AI Core       → Google Gemini 2.5 Flash (@google/genai)
AI Audio      → Google Cloud Speech-to-Text & Text-to-Speech
Utilities     → pdfjs-dist, Axios, UUID, Protobuf
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   CLIENT                        │
│  React "Room" UI                                │
│  useGeminiAudio hook + InterviewContext         │
│  States: INIT → AI_SPEAKING → USER_SPEAKING     │
│          → PROCESSING → EVALUATION              │
└────────────────────┬────────────────────────────┘
                     │ API Calls
┌────────────────────▼────────────────────────────┐
│                   SERVER                        │
│  Stateless Next.js API Routes                   │
│  MongoDB Session Persistence                    │
│  (qaHistory, currentQuestion, transcript)       │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│               AI ENGINE ()                 │
│  InterviewEngine class                          │
│  Parses Resume + JD → Structured Interview Flow │
│  Gemini 2.5 Flash for reasoning & questions     │
│  Google Cloud for high-fidelity audio           │
└─────────────────────────────────────────────────┘
```

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Google Cloud project with Speech-to-Text & TTS APIs enabled
- Google Gemini API key

### Installation

```bash
git clone https://github.com/your-username/pripare-ai.git
cd pripare-ai
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud (Audio)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 💡 How It Works

1. **Upload** your Resume (PDF) and paste the Job Description
2. **** parses both and crafts a personalized question set
3. **Interview** — speak or type your answers in the immersive 3D room
4. ** adapts** — harder or easier questions based on your performance
5. **Get Results** — receive a full evaluation report after the session

---

## 📁 Project Structure

```
pripare-ai/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # Backend API endpoints
│   └── (routes)/           # Frontend pages
├── components/             # React components
│   └── room/               # Interview room (3D avatar, audio, UI)
├── lib/
│   ├── InterviewEngine.ts  # Core AI orchestration logic
│   ├── mongodb.ts          # DB connection
│   └── gemini.ts           # Gemini AI client
├── hooks/
│   └── useGeminiAudio.ts   # Audio streaming hook
├── models/                 # Mongoose schemas (Session, User)
└── context/
    └── InterviewContext.tsx # Global interview state
```

---

## 📄 License

MIT © Abhinav Maurya
