import { useEffect, useState } from 'react'
import { interviewApi } from '@/api/interview'
import type { InterviewSession, InterviewQuestion, AnswerFeedback } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/PageHeader'
import { MessageSquare, Play, Send, ChevronRight, Trophy, RefreshCw, Star, ArrowLeft } from 'lucide-react'
import { cn, getGradeColor } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

type View = 'sessions' | 'setup' | 'active' | 'results'

const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer']

export function InterviewPage() {
  const [view, setView] = useState<View>('sessions')
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null)
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Record<string, AnswerFeedback>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [starting, setStarting] = useState(false)

  // Setup state
  const [setupRole, setSetupRole] = useState('')
  const [setupType, setSetupType] = useState<'technical' | 'hr' | 'mixed'>('mixed')
  const [setupCount, setSetupCount] = useState(5)

  useEffect(() => {
    interviewApi.getSessions()
      .then(({ data }) => setSessions(data.sessions))
      .finally(() => setLoading(false))
  }, [])

  const startInterview = async () => {
    if (!setupRole) return
    setStarting(true)
    try {
      const { data } = await interviewApi.start({
        target_role: setupRole,
        interview_type: setupType,
        num_questions: setupCount,
      })
      setActiveSession(data as any)
      setCurrentQIdx(0)
      setFeedbacks({})
      setAnswer('')
      setShowFeedback(false)
      setView('active')
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Failed to start interview')
    } finally {
      setStarting(false)
    }
  }

  const submitAnswer = async () => {
    if (!activeSession || !answer.trim()) return
    const q = activeSession.questions[currentQIdx]
    setSubmitting(true)
    try {
      const { data } = await interviewApi.submitAnswer({
        session_id: activeSession.id,
        question_id: q.id,
        answer,
      })
      setFeedbacks(prev => ({ ...prev, [q.id]: data.feedback }))
      setShowFeedback(true)
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const nextQuestion = () => {
    if (!activeSession) return
    if (currentQIdx + 1 >= activeSession.questions.length) {
      // Fetch final session with scores
      interviewApi.getSession(activeSession.id).then(({ data }) => {
        setActiveSession(data.session)
        setView('results')
        // Refresh sessions list
        interviewApi.getSessions().then(({ data }) => setSessions(data.sessions))
      })
    } else {
      setCurrentQIdx(i => i + 1)
      setAnswer('')
      setShowFeedback(false)
    }
  }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Interview Prep"
        description="Practice mock interviews with AI-powered real-time feedback"
        action={
          view !== 'sessions' ? (
            <Button variant="ghost" onClick={() => setView('sessions')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Sessions
            </Button>
          ) : (
            <Button onClick={() => setView('setup')} className="gap-2">
              <Play className="w-4 h-4" /> Start New Interview
            </Button>
          )
        }
      />

      {/* Setup view */}
      {view === 'setup' && (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Configure Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={setupRole}
                onChange={e => setSetupRole(e.target.value)}
              >
                <option value="">Select role...</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Interview Type</label>
              <div className="flex gap-2">
                {(['technical', 'hr', 'mixed'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSetupType(t)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all',
                      setupType === t ? 'bg-brand-600 text-white' : 'bg-muted border border-border hover:border-brand-300'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Questions: {setupCount}</label>
              <input
                type="range" min={3} max={10} value={setupCount}
                onChange={e => setSetupCount(parseInt(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3</span><span>10</span>
              </div>
            </div>
            <Button
              onClick={startInterview}
              loading={starting}
              disabled={!setupRole}
              className="w-full gap-2"
              size="lg"
            >
              <Play className="w-4 h-4" /> Start Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active interview */}
      {view === 'active' && activeSession && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Question {currentQIdx + 1} of {activeSession.questions.length}
            </p>
            <Progress
              value={((Object.keys(feedbacks).length) / activeSession.questions.length) * 100}
              className="w-32 h-2"
            />
          </div>

          {(() => {
            const q = activeSession.questions[currentQIdx]
            const fb = feedbacks[q.id]
            return (
              <Card className="border-brand-200">
                <CardHeader className="pb-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="info" className="capitalize">{q.type}</Badge>
                    <Badge variant={q.difficulty === 'hard' ? 'destructive' : q.difficulty === 'medium' ? 'warning' : 'success'} className="capitalize">
                      {q.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2 leading-relaxed">{q.question}</CardTitle>
                  {q.hint && !showFeedback && (
                    <p className="text-xs text-muted-foreground italic">💡 Hint: {q.hint}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showFeedback ? (
                    <>
                      <Textarea
                        rows={6}
                        placeholder="Type your answer here..."
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        className="resize-none"
                      />
                      <Button
                        onClick={submitAnswer}
                        loading={submitting}
                        disabled={!answer.trim()}
                        className="w-full gap-2"
                      >
                        <Send className="w-4 h-4" /> Submit Answer
                      </Button>
                    </>
                  ) : fb ? (
                    <div className="space-y-4">
                      {/* Score */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-brand-50 border border-brand-100">
                        <span className="font-semibold">Your Score</span>
                        <span className="text-2xl font-bold text-brand-600">{fb.score}/10</span>
                      </div>

                      {/* Your answer */}
                      <div className="p-3 rounded-lg bg-muted/40 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer</p>
                        <p className="text-sm">{answer}</p>
                      </div>

                      {/* Feedback */}
                      <div className="p-3 rounded-lg bg-white border border-border">
                        <p className="text-sm">{fb.detailed_feedback}</p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                          <p className="text-xs font-semibold text-green-700 mb-2">Strengths</p>
                          {fb.strengths.map((s, i) => <p key={i} className="text-xs text-green-700">✓ {s}</p>)}
                        </div>
                        <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                          <p className="text-xs font-semibold text-orange-700 mb-2">Improvements</p>
                          {fb.improvements.map((s, i) => <p key={i} className="text-xs text-orange-700">→ {s}</p>)}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <p className="text-xs font-semibold text-purple-700 mb-1">Model Answer Outline</p>
                        <p className="text-xs text-purple-700">{fb.model_answer_outline}</p>
                      </div>

                      <Button onClick={nextQuestion} className="w-full gap-2">
                        {currentQIdx + 1 < activeSession.questions.length
                          ? <><ChevronRight className="w-4 h-4" /> Next Question</>
                          : <><Trophy className="w-4 h-4" /> View Results</>
                        }
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {/* Results */}
      {view === 'results' && activeSession && activeSession.score_summary && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <div className={cn('text-6xl font-bold mb-1', getGradeColor(activeSession.score_summary.grade))}>
                {activeSession.score_summary.grade}
              </div>
              <p className="text-2xl font-semibold mb-1">{activeSession.score_summary.percentage.toFixed(0)}%</p>
              <p className="text-muted-foreground text-sm">
                {activeSession.score_summary.total_score}/{activeSession.score_summary.max_score} points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-sm">{activeSession.score_summary.overall_feedback}</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-700">Top Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                {activeSession.score_summary.top_strengths.map((s, i) => (
                  <p key={i} className="text-sm text-green-700 mb-1">✓ {s}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-700">Key Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                {activeSession.score_summary.key_improvements.map((s, i) => (
                  <p key={i} className="text-sm text-orange-700 mb-1">→ {s}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setView('sessions')}>
              View History
            </Button>
            <Button className="flex-1" onClick={() => { setView('setup') }}>
              <RefreshCw className="w-4 h-4 mr-2" /> New Interview
            </Button>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {view === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Start your first mock interview to practice</p>
              <Button onClick={() => setView('setup')} className="gap-2">
                <Play className="w-4 h-4" /> Start Interview
              </Button>
            </div>
          ) : (
            sessions.map(s => (
              <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setActiveSession(s); setView('results') }}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{s.target_role}</p>
                        <Badge variant={s.status === 'completed' ? 'success' : 'warning'} className="capitalize text-xs">
                          {s.status}
                        </Badge>
                        <Badge variant="info" className="capitalize text-xs">{s.interview_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(s.created_at)}</p>
                    </div>
                    {s.score_summary && (
                      <div className="text-right">
                        <p className={cn('text-2xl font-bold', getGradeColor(s.score_summary.grade))}>
                          {s.score_summary.grade}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.score_summary.percentage.toFixed(0)}%</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
