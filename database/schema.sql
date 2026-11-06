-- CareerForge AI — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===== Student Profiles (canonical versioned profile) =====
create table if not exists student_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  education jsonb not null default '{}',
  technical_skills jsonb not null default '[]',
  soft_skills jsonb not null default '[]',
  certifications jsonb not null default '[]',
  projects jsonb not null default '[]',
  achievements jsonb not null default '[]',
  career_goals jsonb not null default '[]',
  summary_bio text default '',
  profile_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists student_profiles_user_id_idx on student_profiles(user_id);
create index if not exists student_profiles_version_idx on student_profiles(user_id, profile_version desc);

-- ===== AI Career Profiles =====
create table if not exists ai_career_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_version integer not null,
  style text not null default 'professional',
  target_role text,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ai_career_profiles_user_id_idx on ai_career_profiles(user_id);

-- ===== Skill Gap Analyses =====
create table if not exists skill_gap_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  target_level text not null default 'entry',
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists skill_gap_analyses_user_id_idx on skill_gap_analyses(user_id);

-- ===== Learning Roadmaps =====
create table if not exists learning_roadmaps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  target_level text not null default 'entry',
  duration_weeks integer not null default 12,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists learning_roadmaps_user_id_idx on learning_roadmaps(user_id);

-- ===== Interview Sessions =====
create table if not exists interview_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  interview_type text not null default 'mixed',
  questions jsonb not null default '[]',
  answers jsonb not null default '[]',
  status text not null default 'active',
  score_summary jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists interview_sessions_user_id_idx on interview_sessions(user_id);
create index if not exists interview_sessions_status_idx on interview_sessions(user_id, status);

-- ===== Report History =====
create table if not exists report_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null, -- career_profile | skill_gap | roadmap
  source_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists report_history_user_id_idx on report_history(user_id);

-- ===== Row Level Security =====

-- Enable RLS on all tables
alter table student_profiles enable row level security;
alter table ai_career_profiles enable row level security;
alter table skill_gap_analyses enable row level security;
alter table learning_roadmaps enable row level security;
alter table interview_sessions enable row level security;
alter table report_history enable row level security;

-- Policies: users can only access their own data
-- (Backend uses service role key which bypasses RLS, but these protect direct access)

create policy "Users can view own profile" on student_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert own profile" on student_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own profile" on student_profiles
  for update using (auth.uid() = user_id);

create policy "Users can view own career profiles" on ai_career_profiles
  for select using (auth.uid() = user_id);

create policy "Users can view own skill gap analyses" on skill_gap_analyses
  for select using (auth.uid() = user_id);

create policy "Users can view own roadmaps" on learning_roadmaps
  for select using (auth.uid() = user_id);

create policy "Users can view own interview sessions" on interview_sessions
  for select using (auth.uid() = user_id);

create policy "Users can view own reports" on report_history
  for select using (auth.uid() = user_id);

-- ===== Sample Data (Demo Student) =====
-- Note: Replace 'YOUR_USER_ID' with an actual Supabase auth user UUID after signup

-- INSERT INTO student_profiles (user_id, education, technical_skills, soft_skills, certifications, projects, achievements, career_goals, summary_bio)
-- VALUES (
--   'YOUR_USER_ID',
--   '{"institution": "IIT Delhi", "degree": "bachelors", "branch": "Computer Science", "semester": 7, "graduation_year": 2025, "cgpa": 8.4}',
--   '[{"name": "Python", "level": "advanced", "category": "technical"}, {"name": "React", "level": "intermediate", "category": "technical"}, {"name": "SQL", "level": "intermediate", "category": "technical"}, {"name": "Machine Learning", "level": "beginner", "category": "technical"}]',
--   '[{"name": "Communication", "level": "advanced", "category": "soft"}, {"name": "Problem Solving", "level": "expert", "category": "soft"}, {"name": "Teamwork", "level": "advanced", "category": "soft"}]',
--   '[{"name": "AWS Cloud Practitioner", "issuer": "Amazon Web Services", "issued_date": "2024-03", "credential_url": "https://aws.amazon.com/certification"}]',
--   '[{"id": "p1", "title": "Smart Traffic Management System", "description": "Built an ML-based system to optimize traffic signal timing using real-time camera feeds and OpenCV. Reduced simulated congestion by 30%.", "technologies": ["Python", "OpenCV", "TensorFlow", "Flask"], "role": "Lead Developer", "duration": "4 months", "github_url": "https://github.com/demo/traffic", "highlights": ["Implemented YOLO object detection", "REST API with Flask", "Deployed on AWS EC2"]}]',
--   '[{"id": "a1", "title": "Smart India Hackathon 2024 Finalist", "description": "Top 50 teams out of 10,000+ across India for AI traffic management solution", "date": "2024-09"}]',
--   '[{"target_role": "Machine Learning Engineer", "target_industry": "Technology", "experience_level": "entry", "timeline_months": 12}]',
--   'Final year CSE student at IIT Delhi with a passion for AI/ML and building real-world systems. Looking to land my first ML Engineer role.'
-- );
