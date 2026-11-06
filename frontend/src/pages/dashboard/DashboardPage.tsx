import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardOverview } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/authStore'
import {
  BarChart3, Map, MessageSquare, Sparkles, UserCircle,
  TrendingUp, Target, CheckCircle2, ArrowRight, Trophy,
  BookOpen
} from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell
} from 'recharts'
import { cn } from '@/lib/utils'

const COLORS = ['#4f46e5', '#a5b4fc', '#e0e7ff']

export function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    dashboardApi.getOverview()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return <DashboardSkeleton />

  const skillPieData = data ? [
    { name: 'Technical', value: data.skill_counts.technical },
    { name: 'Soft', value: data.skill_counts.soft },
    { name: 'Target', value: Math.max(0, 20 - data.skill_counts.technical - data.skill_counts.soft) },
  ] : []

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting()}, ${user?.email?.split('@')[0] ?? 'Student'} 👋`}
        description="Here's your career intelligence overview"
      />

      {/* Alert: no profile */}
      {!data?.profile_complete && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900 text-sm">Complete your profile</p>
              <p className="text-xs text-amber-700">Add your education, skills and projects to unlock AI features</p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
            <Link to="/profile">Set up profile <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Career Readiness"
          value={data?.readiness_score != null ? `${data.readiness_score.toFixed(0)}%` : '—'}
          subtitle={data?.latest_target_role ?? 'No analysis yet'}
          icon={<TrendingUp className="w-5 h-5" />}
          color="brand"
          href="/skill-gap"
        />
        <StatCard
          title="Roadmap Progress"
          value={data?.roadmap_progress.total ? `${data.roadmap_progress.percentage.toFixed(0)}%` : '—'}
          subtitle={data?.roadmap_progress.total ? `${data.roadmap_progress.completed}/${data.roadmap_progress.total} weeks` : 'No roadmap yet'}
          icon={<Map className="w-5 h-5" />}
          color="purple"
          href="/roadmap"
        />
        <StatCard
          title="Interview Score"
          value={data?.interview_stats.avg_score != null ? `${data.interview_stats.avg_score}%` : '—'}
          subtitle={`${data?.interview_stats.total_sessions ?? 0} sessions`}
          icon={<MessageSquare className="w-5 h-5" />}
          color="green"
          href="/interview"
        />
        <StatCard
          title="Skills Logged"
          value={String(
            (data?.skill_counts.technical ?? 0) + (data?.skill_counts.soft ?? 0)
          )}
          subtitle={`${data?.skill_counts.technical ?? 0} technical · ${data?.skill_counts.soft ?? 0} soft`}
          icon={<BookOpen className="w-5 h-5" />}
          color="orange"
          href="/profile"
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Readiness chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-600" />
              Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.readiness_score != null ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="60%" outerRadius="80%"
                    barSize={12}
                    data={[{ value: data.readiness_score, fill: '#4f46e5' }]}
                    startAngle={90} endAngle={90 - 360 * (data.readiness_score / 100)}
                  >
                    <RadialBar dataKey="value" cornerRadius={6} fill="#4f46e5" />
                    <Tooltip formatter={(v) => `${v}%`} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <p className="text-3xl font-bold -mt-12 text-brand-600">{data.readiness_score.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">/ 100</p>
                <Badge
                  variant={data.readiness_score >= 75 ? 'success' : data.readiness_score >= 50 ? 'warning' : 'destructive'}
                  className="mt-3"
                >
                  {data.readiness_score >= 75 ? 'Job Ready' : data.readiness_score >= 50 ? 'Getting There' : 'Needs Work'}
                </Badge>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Target: {data.latest_target_role}
                </p>
              </div>
            ) : (
              <EmptyState
                icon={<BarChart3 className="w-8 h-8" />}
                text="Run a skill gap analysis"
                href="/skill-gap"
              />
            )}
          </CardContent>
        </Card>

        {/* Roadmap progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="w-4 h-4 text-purple-600" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.roadmap_progress.total ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">
                    {data.roadmap_progress.completed}
                    <span className="text-xl text-muted-foreground font-normal">/{data.roadmap_progress.total}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">weeks completed</p>
                </div>
                <Progress value={data.roadmap_progress.percentage} className="h-3" />
                <p className="text-xs text-center text-muted-foreground">
                  {data.roadmap_progress.percentage.toFixed(0)}% of your roadmap done
                </p>
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link to="/roadmap">Continue learning <ArrowRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>
            ) : (
              <EmptyState icon={<Map className="w-8 h-8" />} text="Generate a learning roadmap" href="/roadmap" />
            )}
          </CardContent>
        </Card>

        {/* Skills breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-500" />
              Skills Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.skill_counts.technical ?? 0) + (data?.skill_counts.soft ?? 0) > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={skillPieData.slice(0, 2)} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                      {skillPieData.slice(0, 2).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-brand-600" />
                    <span>Technical ({data?.skill_counts.technical})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-brand-300" />
                    <span>Soft ({data?.skill_counts.soft})</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={<BookOpen className="w-8 h-8" />} text="Add your skills to profile" href="/profile" />
            )}
          </CardContent>
        </Card>

        {/* Career Goals */}
        {data?.career_goals && data.career_goals.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Career Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {data.career_goals.map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div>
                      <p className="font-medium text-sm">{g.target_role}</p>
                      <p className="text-xs text-muted-foreground">{g.target_industry} · {g.experience_level} level</p>
                    </div>
                    <Badge variant="info">{g.timeline_months} months</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <Card className={cn(data?.career_goals?.length ? 'lg:col-span-1' : 'lg:col-span-3')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { to: '/career-profile', icon: Sparkles, label: 'Generate career profile', color: 'text-brand-600' },
                { to: '/skill-gap', icon: BarChart3, label: 'Analyze skill gaps', color: 'text-orange-500' },
                { to: '/roadmap', icon: Map, label: 'Create learning roadmap', color: 'text-purple-600' },
                { to: '/interview', icon: MessageSquare, label: 'Practice interview', color: 'text-green-600' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4', color)} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color, href }: {
  title: string; value: string; subtitle: string; icon: React.ReactNode; color: string; href: string
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <Link to={href}>
      <Card className="hover:shadow-lg cursor-pointer transition-all border-transparent hover:border-border">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[140px]">{subtitle}</p>
            </div>
            <div className={cn('p-2.5 rounded-xl flex-shrink-0', colorMap[color])}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState({ icon, text, href }: { icon: React.ReactNode; text: string; href: string }) {
  return (
    <div className="text-center py-6">
      <div className="text-muted-foreground/40 flex justify-center mb-3">{icon}</div>
      <p className="text-sm text-muted-foreground mb-3">{text}</p>
      <Button asChild size="sm" variant="outline">
        <Link to={href}>Get started <ArrowRight className="w-3 h-3 ml-1" /></Link>
      </Button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </div>
  )
}
