import { useEffect, useState } from 'react'
import { reportsApi, downloadBlob } from '@/api/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { FileDown, Sparkles, TrendingUp, Map, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ReportItem {
  id: string
  report_type: string
  source_id: string
  created_at: string
}

const reportTypes = [
  {
    key: 'career_profile',
    title: 'Career Profile PDF',
    description: 'Professional summary, LinkedIn content, resume bullets, and key strengths',
    icon: <Sparkles className="w-6 h-6 text-brand-600" />,
    color: 'bg-brand-50 border-brand-200',
  },
  {
    key: 'skill_gap',
    title: 'Skill Gap Analysis PDF',
    description: 'Readiness score breakdown, matched/missing skills, and learning resources',
    icon: <TrendingUp className="w-6 h-6 text-orange-500" />,
    color: 'bg-orange-50 border-orange-200',
  },
  {
    key: 'roadmap',
    title: 'Learning Roadmap PDF',
    description: 'Week-by-week plan, skill priorities, and project recommendations',
    icon: <Map className="w-6 h-6 text-purple-600" />,
    color: 'bg-purple-50 border-purple-200',
  },
]

const typeLabels: Record<string, string> = {
  career_profile: 'Career Profile',
  skill_gap: 'Skill Gap',
  roadmap: 'Roadmap',
}

export function ReportsPage() {
  const [history, setHistory] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    reportsApi.getHistory()
      .then(({ data }) => setHistory(data.reports))
      .finally(() => setLoading(false))
  }, [])

  const download = async (type: string) => {
    setDownloading(type)
    setError('')
    try {
      let res
      if (type === 'career_profile') res = await reportsApi.downloadCareerProfilePdf()
      else if (type === 'skill_gap') res = await reportsApi.downloadSkillGapPdf()
      else res = await reportsApi.downloadRoadmapPdf()

      downloadBlob(res.data as Blob, `careerforge-${type.replace('_', '-')}.pdf`)
      // Refresh history
      const histRes = await reportsApi.getHistory()
      setHistory(histRes.data.reports)
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? 'Download failed.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports & Exports"
        description="Download your career intelligence as professional PDF reports"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Download cards */}
      <div className="grid sm:grid-cols-3 gap-5 mb-8">
        {reportTypes.map(rt => (
          <Card key={rt.key} className={`${rt.color} transition-all hover:shadow-lg`}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
                {rt.icon}
              </div>
              <CardTitle className="text-base">{rt.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{rt.description}</p>
              <Button
                onClick={() => download(rt.key)}
                loading={downloading === rt.key}
                className="w-full gap-2"
                variant={downloading ? 'secondary' : 'default'}
              >
                <FileDown className="w-4 h-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Download history */}
      <div>
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
          Download History
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No downloads yet. Generate a report above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-border hover:border-brand-200 transition-colors">
                <div className="flex items-center gap-3">
                  <FileDown className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{typeLabels[item.report_type] ?? item.report_type} Report</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize text-xs">PDF</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
