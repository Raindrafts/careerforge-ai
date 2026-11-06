// ===== Profile Types =====
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type DegreeLevel = 'bachelors' | 'masters' | 'phd' | 'diploma' | 'other'

export interface Skill {
  name: string
  level: SkillLevel
  category: string
}

export interface Project {
  id?: string
  title: string
  description: string
  technologies: string[]
  role: string
  duration: string
  github_url?: string
  live_url?: string
  highlights: string[]
}

export interface Certification {
  id?: string
  name: string
  issuer: string
  issued_date?: string
  expiry_date?: string
  credential_url?: string
}

export interface Achievement {
  id?: string
  title: string
  description: string
  date?: string
}

export interface CareerGoal {
  target_role: string
  target_industry: string
  experience_level: 'entry' | 'mid' | 'senior'
  timeline_months: number
}

export interface EducationInfo {
  institution: string
  degree: DegreeLevel
  branch: string
  semester?: number
  graduation_year?: number
  cgpa?: number
}

export interface StudentProfile {
  id: string
  user_id: string
  education: EducationInfo
  technical_skills: Skill[]
  soft_skills: Skill[]
  certifications: Certification[]
  projects: Project[]
  achievements: Achievement[]
  career_goals: CareerGoal[]
  summary_bio: string
  profile_version: number
  created_at: string
  updated_at: string
}

export type StudentProfileCreate = Omit<StudentProfile, 'id' | 'user_id' | 'profile_version' | 'created_at' | 'updated_at'>

// ===== Career Profile Types =====
export type WritingStyle = 'professional' | 'creative' | 'technical' | 'concise'

export interface CareerProfileRequest {
  style: WritingStyle
  target_role?: string
}

export interface LinkedInContent {
  headline: string
  about: string
}

export interface ResumeContent {
  professional_summary: string
  skills_section: string
  project_descriptions: { title: string; description: string }[]
  achievement_highlights: string[]
}

export interface CareerProfileAIOutput {
  professional_summary: string
  linkedin: LinkedInContent
  resume: ResumeContent
  key_strengths: string[]
  career_narrative: string
  style_used: WritingStyle
  generation_notes: string
}

export interface CareerProfileResponse {
  id: string
  user_id: string
  profile_version: number
  style: WritingStyle
  target_role?: string
  content: CareerProfileAIOutput
  created_at: string
}

// ===== Skill Gap Types =====
export interface SkillGapRequest {
  target_role: string
  target_level: string
}

export interface SkillMatch {
  skill: string
  category: string
  student_level?: string
  required_level: string
  matched: boolean
  gap_description: string
}

export interface ReadinessBreakdown {
  technical_skills_score: number
  soft_skills_score: number
  project_relevance_score: number
  education_fit_score: number
  total_score: number
  interpretation: string
}

export interface LearningResource {
  title: string
  type: string
  url?: string
  duration?: string
  priority: number
}

export interface SkillGapAIOutput {
  target_role: string
  target_level: string
  readiness: ReadinessBreakdown
  matched_skills: SkillMatch[]
  missing_skills: SkillMatch[]
  priority_gaps: string[]
  strengths: string[]
  recommendations: string[]
  top_resources: LearningResource[]
  analysis_summary: string
}

export interface SkillGapResponse {
  id: string
  user_id: string
  target_role: string
  target_level: string
  content: SkillGapAIOutput
  created_at: string
}

// ===== Roadmap Types =====
export interface RoadmapRequest {
  target_role: string
  target_level: string
  duration_weeks: number
}

export interface WeeklyTask {
  day?: string
  task: string
  duration_hours: number
  resource_url?: string
}

export interface WeeklyPlan {
  week: number
  theme: string
  goal: string
  tasks: WeeklyTask[]
  milestone: string
  completed: boolean
}

export interface SkillPriority {
  skill: string
  prerequisite_skills: string[]
  weeks_needed: number
  importance: 'critical' | 'high' | 'medium' | 'low'
}

export interface ProjectRecommendation {
  title: string
  description: string
  technologies: string[]
  difficulty: string
  estimated_days: number
  github_topics: string[]
}

export interface RoadmapAIOutput {
  target_role: string
  target_level: string
  total_weeks: number
  weekly_plans: WeeklyPlan[]
  skill_priorities: SkillPriority[]
  project_recommendations: ProjectRecommendation[]
  success_metrics: string[]
  roadmap_summary: string
}

export interface RoadmapResponse {
  id: string
  user_id: string
  target_role: string
  target_level: string
  duration_weeks: number
  content: RoadmapAIOutput
  created_at: string
}

export interface RoadmapProgressUpdate {
  week: number
  completed: boolean
}

// ===== Interview Types =====
export type InterviewType = 'technical' | 'hr' | 'mixed'

export interface InterviewStartRequest {
  target_role: string
  interview_type: InterviewType
  num_questions: number
}

export interface InterviewQuestion {
  id: string
  question: string
  type: string
  difficulty: string
  hint?: string
}

export interface AnswerFeedback {
  score: number
  strengths: string[]
  improvements: string[]
  model_answer_outline: string
  detailed_feedback: string
}

export interface InterviewScoreSummary {
  total_score: number
  max_score: number
  percentage: number
  grade: string
  overall_feedback: string
  top_strengths: string[]
  key_improvements: string[]
}

export interface InterviewAnswer {
  question_id: string
  answer: string
  feedback: AnswerFeedback
}

export interface InterviewSession {
  id: string
  user_id: string
  target_role: string
  interview_type: InterviewType
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  status: 'active' | 'completed'
  score_summary?: InterviewScoreSummary
  created_at: string
  completed_at?: string
}

export interface AnswerSubmitRequest {
  session_id: string
  question_id: string
  answer: string
}

export interface AnswerFeedbackResponse {
  question_id: string
  question: string
  answer: string
  feedback: AnswerFeedback
  session_id: string
}

// ===== Dashboard Types =====
export interface DashboardOverview {
  profile_complete: boolean
  readiness_score: number | null
  latest_target_role: string | null
  roadmap_progress: {
    completed: number
    total: number
    percentage: number
  }
  interview_stats: {
    total_sessions: number
    avg_score: number | null
  }
  skill_counts: {
    technical: number
    soft: number
  }
  recent_career_profiles: CareerProfileResponse[]
  career_goals: CareerGoal[]
}
