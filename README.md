# CareerForge AI — Personalized Career Intelligence Platform

An AI-powered full-stack platform that generates personalized career profiles for students based on their skills, academic background, projects, and career goals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| UI Components | Custom shadcn/ui-compatible components |
| Charts | Recharts |
| Backend | Python 3.11+ FastAPI |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (JWT) |
| AI | Google Gemini 1.5 Flash |
| PDF Generation | ReportLab (server-side) |
| State Management | Zustand |
| Form Handling | React Hook Form + Zod |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project (free tier works)
- A Google Gemini API key (free at https://aistudio.google.com)

---

### 1. Database Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor → paste the contents of `database/schema.sql` → Run

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and Gemini credentials

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be at http://localhost:8000
Interactive docs at http://localhost:8000/docs

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Start development server
npm run dev
```

The app will be at http://localhost:5173

---

## Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
ALLOWED_ORIGINS=http://localhost:5173
APP_ENV=development
```

**Where to find these:**
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API
- `SUPABASE_JWT_SECRET`: Supabase Dashboard → Settings → API → JWT Settings
- `GEMINI_API_KEY`: https://aistudio.google.com/app/apikey

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8000
```

**Where to find these:**
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API (use the `anon public` key, NOT the service role key)

---

## Feature Overview

### 1. Authentication
- Email/password signup, login, logout
- Password reset via email
- Protected routes with Supabase JWT

### 2. Student Profile Builder
- Education details (institution, degree, branch, CGPA, semester)
- Technical and soft skills with proficiency levels
- Projects with descriptions, technologies, GitHub links
- Certifications with issuer and dates
- Career goals with target roles and timelines
- Professional bio

### 3. AI Career Profile Generator
- Professional summary (first-person, fact-based)
- LinkedIn headline and About section
- Resume-ready content (summary, skills section, project descriptions)
- Multiple writing styles (professional, creative, technical, concise)
- Key strengths derived from actual profile data
- Career narrative
- AI suggestions clearly labeled as suggestions (not facts)

### 4. AI Skill Gap Analysis
- Compare profile against 15 predefined target roles
- Transparent readiness score with formula:
  - Technical skills: 50 points
  - Soft skills: 20 points
  - Project relevance: 20 points
  - Education fit: 10 points
- Visual score breakdown with charts
- Matched vs missing skills list
- Priority gaps ranked by importance
- Specific learning resource recommendations

### 5. Personalized Learning Roadmap
- 8, 12, 16, or 24-week personalized plans
- Weekly themes, goals, daily tasks with time estimates
- Milestones for each week
- Skill priority ordering with prerequisites
- Portfolio project recommendations
- Progress tracking (check off completed weeks)

### 6. AI Interview Preparation
- Configure: role, type (technical/HR/mixed), question count
- AI generates role-specific questions
- Submit answers and get instant AI feedback
- Score per question (0–10) with strengths/improvements
- Model answer outline
- Session history with grade summary (A–F)

### 7. PDF Reports
- Career Profile PDF (professional layout)
- Skill Gap Analysis PDF (score table + recommendations)
- Learning Roadmap PDF (weekly plan)
- Download history tracking

### 8. Dashboard
- Career readiness score
- Roadmap progress
- Interview performance stats
- Skills breakdown chart
- Career goals overview
- Quick action shortcuts

---

## AI Safety Guardrails

1. **No fabrication**: AI only references skills, projects, and facts explicitly in the student profile
2. **Fact vs suggestion**: AI suggestions are clearly labeled as such, never presented as facts
3. **Transparent scoring**: Readiness score formula is shown to users with component breakdowns
4. **Key security**: Gemini API key stays in backend only, never exposed to frontend
5. **Retry handling**: 3 retries with exponential backoff on Gemini API failures
6. **Schema validation**: All AI outputs are validated by Pydantic before storage

---

## API Documentation

Full interactive API docs available at http://localhost:8000/docs after starting the backend.

### Key Endpoints
```
GET  /api/profile/me              — Get student profile
POST /api/profile/                — Create/update profile

POST /api/career/generate         — Generate AI career profile
GET  /api/career/latest           — Get latest profile

POST /api/skill-gap/analyze       — Run skill gap analysis
GET  /api/skill-gap/roles         — List available target roles

POST /api/roadmap/generate        — Generate learning roadmap
PATCH /api/roadmap/progress       — Update week completion

POST /api/interview/start         — Start mock interview
POST /api/interview/submit        — Submit answer, get feedback

POST /api/reports/career-profile/pdf  — Download career PDF
POST /api/reports/skill-gap/pdf       — Download skill gap PDF
POST /api/reports/roadmap/pdf         — Download roadmap PDF

GET  /api/dashboard/overview      — Dashboard data
```

---

## Project Structure

```
careerforge-ai/
├── frontend/          React + Vite + TypeScript
│   ├── src/
│   │   ├── api/       Axios API client layer
│   │   ├── components/ UI components + layout
│   │   ├── pages/     Route-level pages
│   │   ├── hooks/     Custom React hooks
│   │   ├── store/     Zustand state management
│   │   └── types/     TypeScript interfaces
│   └── package.json
│
├── backend/           Python FastAPI
│   ├── app/
│   │   ├── api/       Route handlers
│   │   ├── core/      Config, security
│   │   ├── schemas/   Pydantic models
│   │   ├── services/  AI, PDF, profile logic
│   │   └── db/        Supabase client
│   └── requirements.txt
│
├── database/
│   └── schema.sql     Complete DB schema with RLS
│
└── README.md
```
