import { useEffect, useState } from 'react'
import { roadmapApi } from '@/api/roadmap'
import type { RoadmapResponse } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { Map, CheckCircle2, Circle, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer',
  'DevOps Engineer', 'Mobile Developer']

export function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [targetRole, setTargetRole] = useState('')
  const [level, setLevel] = useState('entry')
  const [weeks, setWeeks] = useState(12)
  const [error, setError] = useState('')

  useEffect(() => {
    roadmapApi.getLatest()
      .then(({ data }) => {
        if (data.roadmap) setRoadmap(data.roadmap)
      })
      .finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    if (!targetRole) return
    setGenerating(true)
    setError('')
    try {
      const { data } = await roadmapApi.generate({ target_role: targetRole, target_level: level, duration_weeks: weeks })
      setRoadmap(data as any)
      setExpandedWeeks(new Set([1]))
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleWeek = async (week: number, completed: boolean) => {
    if (!roadmap) return
    try {
      await roadmapApi.updateProgress({ week, completed })
      setRoadmap(prev => {
        if (!prev) return prev
        return {
          ...prev,
          content: {
            ...prev.content,
            weekly_plans: prev.content.weekly_plans.map(w =>
              w.week === week ? { ...w, completed } : w
            )
          }
        }
      })
    } catch (e) {
      console.error(e)
    }
  }

  const toggleExpanded = (week: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>

  const plans = roadmap?.content.weekly_plans ?? []
  const completedCount = plans.filter(w => w.completed).length
  const progressPct = plans.length > 0 ? (completedCount / plans.length) * 100 : 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Learning Roadmap"
        description="Your personalized week-by-week career learning plan"
      />

      {/* Generation control */}
      <Card className="mb-6 border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-48">
              <label className="text-sm font-medium">Target Role</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
              >
                <option value="">Select a role...</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Level</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm min-w-32"
                value={level}
                onChange={e => setLevel(e.target.value)}
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm min-w-28"
                value={weeks}
                onChange={e => setWeeks(parseInt(e.target.value))}
              >
                <option value={8}>8 weeks</option>
                <option value={12}>12 weeks</option>
                <option value={16}>16 weeks</option>
                <option value={24}>24 weeks</option>
              </select>
            </div>
            <Button onClick={generate} loading={generating} disabled={!targetRole} className="gap-2">
              <Map className="w-4 h-4" />
              {roadmap ? 'Regenerate' : 'Generate'} Roadmap
            </Button>
          </div>
          {generating && (
            <p className="text-sm text-brand-600 mt-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Building your personalized {weeks}-week roadmap...
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
      )}

      {roadmap ? (
        <div className="space-y-6">
          {/* Progress header */}
          <Card className="border-brand-200">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{roadmap.content.target_role}</p>
                  <p className="text-sm text-muted-foreground">{roadmap.content.total_weeks}-week plan · {roadmap.target_level} level</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-600">{completedCount}/{plans.length}</p>
                  <p className="text-xs text-muted-foreground">weeks done</p>
                </div>
              </div>
              <Progress value={progressPct} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">{progressPct.toFixed(0)}% complete</p>
              {roadmap.content.roadmap_summary && (
                <p className="text-sm text-muted-foreground mt-3 p-3 rounded-lg bg-muted/40">
                  {roadmap.content.roadmap_summary}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Weekly plans */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Weekly Plan</h2>
              {plans.map(week => (
                <Card key={week.week} className={cn(
                  'transition-all',
                  week.completed && 'bg-green-50/50 border-green-200'
                )}>
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleExpanded(week.week)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWeek(week.week, !week.completed) }}
                      className={cn('transition-colors flex-shrink-0', week.completed ? 'text-green-500' : 'text-muted-foreground hover:text-green-400')}
                      aria-label={week.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {week.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" className="text-xs flex-shrink-0">Week {week.week}</Badge>
                        <span className="font-medium text-sm truncate">{week.theme}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{week.goal}</p>
                    </div>
                    {expandedWeeks.has(week.week) ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </div>
                  {expandedWeeks.has(week.week) && (
                    <CardContent className="pt-0 pb-4 px-4 border-t border-border/50">
                      <div className="space-y-2 mt-3">
                        {week.tasks.map((task, ti) => (
                          <div key={ti} className="flex items-start gap-2 text-sm">
                            <span className="text-brand-600 mt-0.5">•</span>
                            <span className="flex-1">{task.task}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{task.duration_hours}h</span>
                            {task.resource_url && (
                              <a href={task.resource_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex-shrink-0">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 rounded-lg bg-brand-50 border border-brand-100">
                        <p className="text-xs font-medium text-brand-700">🎯 Milestone: {week.milestone}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Sidebar: skill priorities & projects */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Skill Priorities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roadmap.content.skill_priorities.slice(0, 6).map((sp, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{sp.skill}</span>
                        <Badge
                          variant={sp.importance === 'critical' ? 'destructive' : sp.importance === 'high' ? 'warning' : 'secondary'}
                          className="text-xs capitalize"
                        >
                          {sp.importance}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{sp.weeks_needed} week(s) needed</p>
                      {sp.prerequisite_skills.length > 0 && (
                        <p className="text-xs text-muted-foreground">Pre: {sp.prerequisite_skills.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recommended Projects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roadmap.content.project_recommendations.slice(0, 3).map((proj, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                      <p className="text-sm font-medium">{proj.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">{proj.difficulty}</Badge>
                        <span className="text-xs text-muted-foreground">~{proj.estimated_days}d</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proj.technologies.slice(0, 3).map((t, ti) => (
                          <span key={ti} className="text-xs bg-white border border-border rounded px-1.5 py-0.5">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Success Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roadmap.content.success_metrics.map((m, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Map className="w-12 h-12 text-brand-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No roadmap yet</h3>
          <p className="text-muted-foreground text-sm">Select a role and generate your personalized learning roadmap.</p>
        </div>
      )}
    </div>
  )
}
