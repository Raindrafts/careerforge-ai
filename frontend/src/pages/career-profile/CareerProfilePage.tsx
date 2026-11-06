import { useEffect, useState } from 'react'
import { careerApi } from '@/api/career'
import type { CareerProfileResponse, WritingStyle } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Sparkles, Copy, CheckCheck, RefreshCw, Linkedin, FileText, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const STYLES: WritingStyle[] = ['professional', 'creative', 'technical', 'concise']

export function CareerProfilePage() {
  const [data, setData] = useState<CareerProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [style, setStyle] = useState<WritingStyle>('professional')
  const [targetRole, setTargetRole] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    careerApi.getLatest()
      .then(({ data }) => {
        if (data.career_profile) setData(data.career_profile)
      })
      .finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const { data: res } = await careerApi.generate({ style, target_role: targetRole || undefined })
      setData(res as any)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI Career Profile"
        description="Professional content generated from your verified profile data"
      />

      {/* Generation control */}
      <Card className="mb-6 border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-48">
              <label className="text-sm font-medium">Writing Style</label>
              <div className="flex gap-2 flex-wrap">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${style === s
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border border-border hover:border-brand-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 flex-1 min-w-48">
              <label className="text-sm font-medium">Target Role (optional)</label>
              <input
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                placeholder="e.g. Machine Learning Engineer"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
              />
            </div>
            <Button onClick={generate} loading={generating} className="gap-2 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
              {data ? 'Regenerate' : 'Generate'} Career Profile
            </Button>
          </div>
          {generating && (
            <p className="text-sm text-brand-600 mt-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Gemini AI is crafting your career profile...
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {data ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="info">{data.style}</Badge>
            {data.target_role && <Badge variant="secondary">{data.target_role}</Badge>}
            <span className="text-xs text-muted-foreground ml-auto">Generated {formatDate(data.created_at)}</span>
          </div>

          <Tabs defaultValue="summary">
            <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="linkedin"><Linkedin className="w-3.5 h-3.5 mr-1" />LinkedIn</TabsTrigger>
              <TabsTrigger value="resume"><FileText className="w-3.5 h-3.5 mr-1" />Resume</TabsTrigger>
              <TabsTrigger value="strengths"><Star className="w-3.5 h-3.5 mr-1" />Strengths</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="space-y-4">
                <CopyableCard title="Professional Summary" content={data.content.professional_summary} />
                <CopyableCard title="Career Narrative" content={data.content.career_narrative} />
                {data.content.generation_notes && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-amber-800">💡 AI Suggestions for Your Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-amber-700 italic">{data.content.generation_notes}</p>
                      <p className="text-xs text-amber-600 mt-2">These are suggestions to improve your profile, not facts about you.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="linkedin">
              <div className="space-y-4">
                <CopyableCard title="LinkedIn Headline" content={data.content.linkedin.headline} />
                <CopyableCard title="LinkedIn About Section" content={data.content.linkedin.about} />
              </div>
            </TabsContent>

            <TabsContent value="resume">
              <div className="space-y-4">
                <CopyableCard title="Professional Summary" content={data.content.resume.professional_summary} />
                <CopyableCard title="Skills Section" content={data.content.resume.skills_section} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Descriptions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.content.resume.project_descriptions.map((proj, i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/40 border border-border">
                        <p className="font-semibold text-sm mb-2">{proj.title}</p>
                        <p className="text-sm text-muted-foreground">{proj.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Achievement Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.content.resume.achievement_highlights.map((a, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-brand-600 font-bold">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="strengths">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {data.content.key_strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
                        <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                          {i + 1}
                        </div>
                        <p className="text-sm">{s}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-brand-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No career profile yet</h3>
          <p className="text-muted-foreground text-sm">Click "Generate Career Profile" above to create your AI-powered career content.</p>
        </div>
      )}
    </div>
  )
}

function CopyableCard({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={copy} className="gap-1 text-xs">
            {copied ? <><CheckCheck className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  )
}
