import { useEffect, useState } from 'react'
import { skillGapApi } from '@/api/skillGap'
import type { SkillGapResponse } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { CheckCircle2, XCircle, Zap, TrendingUp, AlertTriangle, BookOpen, RefreshCw } from 'lucide-react'
import { cn, getReadinessBg } from '@/lib/utils'

export function SkillGapPage() {
  const [analysis, setAnalysis] = useState<SkillGapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [roles, setRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [level, setLevel] = useState('entry')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      skillGapApi.getLatest(),
      skillGapApi.getRoles(),
    ]).then(([latestRes, rolesRes]) => {
      if (latestRes.data.analysis) setAnalysis(latestRes.data.analysis)
      setRoles(rolesRes.data.roles)
    }).finally(() => setLoading(false))
  }, [])

  const analyze = async () => {
    if (!selectedRole) return
    setAnalyzing(true)
    setError('')
    try {
      const { data } = await skillGapApi.analyze({ target_role: selectedRole, target_level: level })
      setAnalysis(data as any)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>

  const breakdown = analysis?.content.readiness
  const barData = breakdown ? [
    { name: 'Technical Skills', score: breakdown.technical_skills_score, max: 50 },
    { name: 'Soft Skills', score: breakdown.soft_skills_score, max: 20 },
    { name: 'Project Relevance', score: breakdown.project_relevance_score, max: 20 },
    { name: 'Education Fit', score: breakdown.education_fit_score, max: 10 },
  ] : []

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Skill Gap Analysis"
        description="Compare your current skills with target role requirements"
      />

      {/* Analysis control */}
      <Card className="mb-6 border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-48">
              <label className="text-sm font-medium">Target Role</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
              >
                <option value="">Select a role...</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Level</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm min-w-32"
                value={level}
                onChange={e => setLevel(e.target.value)}
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
              </select>
            </div>
            <Button onClick={analyze} loading={analyzing} disabled={!selectedRole} className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Analyze Skill Gap
            </Button>
          </div>
          {analyzing && (
            <p className="text-sm text-brand-600 mt-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing your skills against {selectedRole}...
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
      )}

      {analysis ? (
        <div className="space-y-6">
          {/* Score Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="lg:col-span-1 border-brand-200">
              <CardContent className="pt-5 text-center">
                <div className="text-5xl font-bold text-brand-600 mb-1">
                  {breakdown?.total_score.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground mb-2">/ 100</div>
                <Badge className={cn('text-xs', getReadinessBg(breakdown?.total_score ?? 0))}>
                  Readiness Score
                </Badge>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  {breakdown?.interpretation}
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score Breakdown — Transparent Formula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {barData.map(item => (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.score.toFixed(1)} / {item.max}</span>
                      </div>
                      <Progress value={(item.score / item.max) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score by Component</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 50]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v: number) => v.toFixed(1)} />
                    <Bar dataKey="score" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills Match Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {analysis.content.matched_skills.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Matched</div>
                  </div>
                  <div className="text-4xl text-muted-foreground">vs</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-500">
                      {analysis.content.missing_skills.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Missing</div>
                  </div>
                </div>
                <Progress
                  value={(analysis.content.matched_skills.length / (analysis.content.matched_skills.length + analysis.content.missing_skills.length)) * 100}
                  className="h-3 mt-2"
                />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {Math.round((analysis.content.matched_skills.length / (analysis.content.matched_skills.length + analysis.content.missing_skills.length)) * 100)}% skills match
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Skills lists */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Matched Skills ({analysis.content.matched_skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {analysis.content.matched_skills.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-green-50 border border-green-100">
                      <div>
                        <span className="text-sm font-medium">{s.skill}</span>
                        <span className="text-xs text-muted-foreground ml-2">({s.category})</span>
                      </div>
                      <Badge variant="success" className="text-xs">{s.student_level}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Missing Skills ({analysis.content.missing_skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {analysis.content.missing_skills.map((s, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{s.skill}</span>
                        <Badge variant="destructive" className="text-xs">{s.required_level}</Badge>
                      </div>
                      {s.gap_description && (
                        <p className="text-xs text-muted-foreground mt-1">{s.gap_description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority gaps & recommendations */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Priority Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.content.priority_gaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm">{gap}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.content.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-brand-50 border border-brand-100">
                      <span className="text-brand-600 font-bold text-sm flex-shrink-0">→</span>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Top Learning Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.content.top_resources.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border hover:border-brand-300 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium line-clamp-2">{r.title}</p>
                      <Badge variant={r.priority === 1 ? 'default' : r.priority === 2 ? 'secondary' : 'outline'} className="text-xs flex-shrink-0">
                        {r.priority === 1 ? 'High' : r.priority === 2 ? 'Med' : 'Low'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{r.type}{r.duration ? ` · ${r.duration}` : ''}</p>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:underline mt-1 block">
                        Visit resource →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-brand-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No analysis yet</h3>
          <p className="text-muted-foreground text-sm">Select a target role above and run your first skill gap analysis.</p>
        </div>
      )}
    </div>
  )
}
