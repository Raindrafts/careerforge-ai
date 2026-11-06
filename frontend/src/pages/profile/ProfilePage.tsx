import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { profileApi } from '@/api/profile'
import type { StudentProfileCreate, Skill, SkillLevel } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react'

const skillLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']

const levelColors: Record<SkillLevel, string> = {
  beginner: 'bg-gray-100 text-gray-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
  expert: 'bg-green-100 text-green-700',
}

export function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [newTechSkill, setNewTechSkill] = useState('')
  const [newSoftSkill, setNewSoftSkill] = useState('')

  const [formData, setFormData] = useState<StudentProfileCreate>({
    education: { institution: '', degree: 'bachelors', branch: '', cgpa: undefined, semester: undefined, graduation_year: undefined },
    technical_skills: [],
    soft_skills: [],
    certifications: [],
    projects: [],
    achievements: [],
    career_goals: [],
    summary_bio: '',
  })

  useEffect(() => {
    profileApi.getMe()
      .then(({ data }) => {
        if (data.profile) {
          const { id, user_id, profile_version, created_at, updated_at, ...rest } = data.profile
          setFormData(rest)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await profileApi.upsert(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = (type: 'technical' | 'soft', name: string) => {
    if (!name.trim()) return
    const skill: Skill = { name: name.trim(), level: 'intermediate', category: type }
    if (type === 'technical') {
      setFormData(p => ({ ...p, technical_skills: [...p.technical_skills, skill] }))
      setNewTechSkill('')
    } else {
      setFormData(p => ({ ...p, soft_skills: [...p.soft_skills, skill] }))
      setNewSoftSkill('')
    }
  }

  const removeSkill = (type: 'technical' | 'soft', idx: number) => {
    if (type === 'technical')
      setFormData(p => ({ ...p, technical_skills: p.technical_skills.filter((_, i) => i !== idx) }))
    else
      setFormData(p => ({ ...p, soft_skills: p.soft_skills.filter((_, i) => i !== idx) }))
  }

  const updateSkillLevel = (type: 'technical' | 'soft', idx: number, level: SkillLevel) => {
    if (type === 'technical')
      setFormData(p => ({ ...p, technical_skills: p.technical_skills.map((s, i) => i === idx ? { ...s, level } : s) }))
    else
      setFormData(p => ({ ...p, soft_skills: p.soft_skills.map((s, i) => i === idx ? { ...s, level } : s) }))
  }

  const addProject = () => {
    setFormData(p => ({
      ...p,
      projects: [...p.projects, {
        title: '', description: '', technologies: [], role: '', duration: '',
        highlights: [], github_url: '', live_url: ''
      }]
    }))
  }

  const addCertification = () => {
    setFormData(p => ({
      ...p,
      certifications: [...p.certifications, { name: '', issuer: '', issued_date: '' }]
    }))
  }

  const addGoal = () => {
    setFormData(p => ({
      ...p,
      career_goals: [...p.career_goals, {
        target_role: '', target_industry: '', experience_level: 'entry', timeline_months: 12
      }]
    }))
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Profile"
        description="Your canonical career profile — all AI outputs are generated from this data"
        action={
          <Button onClick={handleSave} loading={saving} className="gap-2">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="education" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="goals">Career Goals</TabsTrigger>
        </TabsList>

        {/* Education Tab */}
        <TabsContent value="education">
          <Card>
            <CardHeader><CardTitle>Education Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution *</Label>
                  <Input
                    placeholder="e.g. IIT Delhi"
                    value={formData.education.institution}
                    onChange={e => setFormData(p => ({ ...p, education: { ...p.education, institution: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch / Major *</Label>
                  <Input
                    placeholder="e.g. Computer Science"
                    value={formData.education.branch}
                    onChange={e => setFormData(p => ({ ...p, education: { ...p.education, branch: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.education.degree}
                    onChange={e => setFormData(p => ({ ...p, education: { ...p.education, degree: e.target.value as any } }))}
                  >
                    <option value="bachelors">Bachelor's</option>
                    <option value="masters">Master's</option>
                    <option value="phd">PhD</option>
                    <option value="diploma">Diploma</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>CGPA (out of 10)</Label>
                  <Input
                    type="number" step="0.1" min="0" max="10"
                    placeholder="e.g. 8.5"
                    value={formData.education.cgpa ?? ''}
                    onChange={e => setFormData(p => ({ ...p, education: { ...p.education, cgpa: parseFloat(e.target.value) || undefined } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Semester</Label>
                  <Input
                    type="number" min="1" max="12"
                    placeholder="e.g. 6"
                    value={formData.education.semester ?? ''}
                    onChange={e => setFormData(p => ({ ...p, education: { ...p.education, semester: parseInt(e.target.value) || undefined } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input
                    type="number" min="2020" max="2035"
                    placeholder="e.g. 2025"
                    value={formData.education.graduation_year ?? ''}
                    onChange={e => setFormData(p => ({ ...p, education: { ...p.education, graduation_year: parseInt(e.target.value) || undefined } }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Professional Bio</Label>
                <Textarea
                  rows={4}
                  placeholder="Brief summary about yourself, your background and career aspirations..."
                  value={formData.summary_bio}
                  onChange={e => setFormData(p => ({ ...p, summary_bio: e.target.value }))}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Technical Skills</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a technical skill..."
                    value={newTechSkill}
                    onChange={e => setNewTechSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill('technical', newTechSkill)}
                  />
                  <Button size="icon" onClick={() => addSkill('technical', newTechSkill)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {formData.technical_skills.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <span className="text-sm font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs rounded px-2 py-1 border-0 bg-transparent cursor-pointer"
                          value={s.level}
                          onChange={e => updateSkillLevel('technical', i, e.target.value as SkillLevel)}
                        >
                          {skillLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <button onClick={() => removeSkill('technical', i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.technical_skills.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No skills added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Soft Skills</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a soft skill..."
                    value={newSoftSkill}
                    onChange={e => setNewSoftSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill('soft', newSoftSkill)}
                  />
                  <Button size="icon" onClick={() => addSkill('soft', newSoftSkill)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {formData.soft_skills.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <span className="text-sm font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs rounded px-2 py-1 border-0 bg-transparent cursor-pointer"
                          value={s.level}
                          onChange={e => updateSkillLevel('soft', i, e.target.value as SkillLevel)}
                        >
                          {skillLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <button onClick={() => removeSkill('soft', i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.soft_skills.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No skills added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="space-y-4">
            <Button onClick={addProject} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Add Project
            </Button>
            {formData.projects.map((proj, i) => (
              <Card key={i}>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Project {i + 1}</h3>
                    <button
                      onClick={() => setFormData(p => ({ ...p, projects: p.projects.filter((_, j) => j !== i) }))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Title *</Label>
                      <Input
                        placeholder="e.g. Smart Traffic System"
                        value={proj.title}
                        onChange={e => {
                          const projects = [...formData.projects]
                          projects[i] = { ...projects[i], title: e.target.value }
                          setFormData(p => ({ ...p, projects }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Your Role</Label>
                      <Input
                        placeholder="e.g. Full Stack Developer"
                        value={proj.role}
                        onChange={e => {
                          const projects = [...formData.projects]
                          projects[i] = { ...projects[i], role: e.target.value }
                          setFormData(p => ({ ...p, projects }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Technologies (comma-separated)</Label>
                      <Input
                        placeholder="e.g. React, Node.js, PostgreSQL"
                        value={proj.technologies.join(', ')}
                        onChange={e => {
                          const projects = [...formData.projects]
                          projects[i] = { ...projects[i], technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }
                          setFormData(p => ({ ...p, projects }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        placeholder="e.g. 3 months"
                        value={proj.duration}
                        onChange={e => {
                          const projects = [...formData.projects]
                          projects[i] = { ...projects[i], duration: e.target.value }
                          setFormData(p => ({ ...p, projects }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>GitHub URL</Label>
                      <Input
                        placeholder="https://github.com/..."
                        value={proj.github_url ?? ''}
                        onChange={e => {
                          const projects = [...formData.projects]
                          projects[i] = { ...projects[i], github_url: e.target.value }
                          setFormData(p => ({ ...p, projects }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Live URL</Label>
                      <Input
                        placeholder="https://..."
                        value={proj.live_url ?? ''}
                        onChange={e => {
                          const projects = [...formData.projects]
                          projects[i] = { ...projects[i], live_url: e.target.value }
                          setFormData(p => ({ ...p, projects }))
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      rows={3}
                      placeholder="What did you build? What problem does it solve? What's the impact?"
                      value={proj.description}
                      onChange={e => {
                        const projects = [...formData.projects]
                        projects[i] = { ...projects[i], description: e.target.value }
                        setFormData(p => ({ ...p, projects }))
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {formData.projects.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground text-sm">No projects added yet. Click "Add Project" to start.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications">
          <div className="space-y-4">
            <Button onClick={addCertification} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Add Certification
            </Button>
            {formData.certifications.map((cert, i) => (
              <Card key={i}>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Certification {i + 1}</h3>
                    <button
                      onClick={() => setFormData(p => ({ ...p, certifications: p.certifications.filter((_, j) => j !== i) }))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Certificate Name *</Label>
                      <Input
                        placeholder="e.g. AWS Cloud Practitioner"
                        value={cert.name}
                        onChange={e => {
                          const certifications = [...formData.certifications]
                          certifications[i] = { ...certifications[i], name: e.target.value }
                          setFormData(p => ({ ...p, certifications }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuer *</Label>
                      <Input
                        placeholder="e.g. Amazon Web Services"
                        value={cert.issuer}
                        onChange={e => {
                          const certifications = [...formData.certifications]
                          certifications[i] = { ...certifications[i], issuer: e.target.value }
                          setFormData(p => ({ ...p, certifications }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issued Date</Label>
                      <Input
                        type="month"
                        value={cert.issued_date ?? ''}
                        onChange={e => {
                          const certifications = [...formData.certifications]
                          certifications[i] = { ...certifications[i], issued_date: e.target.value }
                          setFormData(p => ({ ...p, certifications }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credential URL</Label>
                      <Input
                        placeholder="https://..."
                        value={cert.credential_url ?? ''}
                        onChange={e => {
                          const certifications = [...formData.certifications]
                          certifications[i] = { ...certifications[i], credential_url: e.target.value }
                          setFormData(p => ({ ...p, certifications }))
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {formData.certifications.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground text-sm">No certifications added yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Career Goals Tab */}
        <TabsContent value="goals">
          <div className="space-y-4">
            <Button onClick={addGoal} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Add Career Goal
            </Button>
            {formData.career_goals.map((goal, i) => (
              <Card key={i}>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Goal {i + 1}</h3>
                    <button
                      onClick={() => setFormData(p => ({ ...p, career_goals: p.career_goals.filter((_, j) => j !== i) }))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Role *</Label>
                      <Input
                        placeholder="e.g. Machine Learning Engineer"
                        value={goal.target_role}
                        onChange={e => {
                          const goals = [...formData.career_goals]
                          goals[i] = { ...goals[i], target_role: e.target.value }
                          setFormData(p => ({ ...p, career_goals: goals }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Industry</Label>
                      <Input
                        placeholder="e.g. Technology"
                        value={goal.target_industry}
                        onChange={e => {
                          const goals = [...formData.career_goals]
                          goals[i] = { ...goals[i], target_industry: e.target.value }
                          setFormData(p => ({ ...p, career_goals: goals }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Experience Level</Label>
                      <select
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={goal.experience_level}
                        onChange={e => {
                          const goals = [...formData.career_goals]
                          goals[i] = { ...goals[i], experience_level: e.target.value as any }
                          setFormData(p => ({ ...p, career_goals: goals }))
                        }}
                      >
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior Level</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timeline (months)</Label>
                      <Input
                        type="number" min="1" max="60"
                        value={goal.timeline_months}
                        onChange={e => {
                          const goals = [...formData.career_goals]
                          goals[i] = { ...goals[i], timeline_months: parseInt(e.target.value) || 12 }
                          setFormData(p => ({ ...p, career_goals: goals }))
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {formData.career_goals.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground text-sm">No career goals added yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} size="lg" loading={saving} className="gap-2">
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
        </Button>
      </div>
    </div>
  )
}
