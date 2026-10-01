export type Experience = { id: string | number; company: string; job_title: string; location: string; start_date: string; end_date: string; is_current: boolean; achievements: string[] }
export type Education = { id: string | number; institution: string; degree: string; field_of_study: string; location: string; start_date: string; end_date: string }
export type Skill = { id: string | number; name: string }
export type Language = { id: string | number; name: string; proficiency: string }
export type Project = { id: string | number; name: string; description: string; url: string; tech_stack: string }
export type BulletSuggestion = { id: number; text: string; keywords: string[]; focus: string }
export type AuthUser = { id: number; full_name: string; email: string; phone_number: string | null; location: string | null; created_at: string; updated_at: string }
export type ResumeDraft = { id?: number; title: string; target_role: string; full_name: string; email: string; phone: string; location: string; professional_summary: string; linkedin_url: string; github_url: string; portfolio_url: string; experiences: Experience[]; educations: Education[]; skills: Skill[]; languages: Language[]; projects: Project[] }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('leon_access_token')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || `Request failed with ${response.status}`)
  return response.json() as Promise<T>
}

const toApiDate = (value: string) => value ? `${value}-01` : null
const toMonth = (value: string | null) => value ? value.slice(0, 7) : ''

export async function checkHealth() {
  return request<{ status: string; db?: string; service?: string }>('/api/health')
}

export async function login(email: string, password: string) {
  const result = await request<{ user: AuthUser; access_token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  localStorage.setItem('leon_access_token', result.access_token)
  return result.user
}

export async function register(details: { full_name: string; email: string; phone_number: string; password: string }) {
  return request<{ user: AuthUser; verification_required: boolean; message: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(details) })
}

export async function me() {
  return (await request<{ user: AuthUser }>('/api/auth/me')).user
}

export function logout() {
  localStorage.removeItem('leon_access_token')
}

export async function enhanceBullet(bullet: string, jobTitle?: string) {
  const result = await request<{ suggestions: BulletSuggestion[] }>('/api/ai/enhance-bullet', { method: 'POST', body: JSON.stringify({ bullet, job_title: jobTitle }) })
  return result.suggestions
}

export async function saveResume(cvData: ResumeDraft) {
  const result = await request<{ resume: { id: number } }>('/api/resumes', { method: 'POST', body: JSON.stringify({ title: cvData.title || `${cvData.full_name} Resume`, target_role: cvData.target_role, professional_summary: cvData.professional_summary || null, linkedin_url: cvData.linkedin_url || null, github_url: cvData.github_url || null, portfolio_url: cvData.portfolio_url || null, status: 'draft' }) })
  const resumeId = result.resume.id
  await Promise.all([
    ...cvData.experiences.map((item) => request(`/api/resumes/${resumeId}/experiences`, { method: 'POST', body: JSON.stringify({ company: item.company, job_title: item.job_title, location: item.location, start_date: toApiDate(item.start_date), end_date: toApiDate(item.end_date), is_current: item.is_current, achievements: item.achievements }) })),
    ...cvData.educations.map((item) => request(`/api/resumes/${resumeId}/educations`, { method: 'POST', body: JSON.stringify({ institution: item.institution, degree: item.degree, field_of_study: item.field_of_study, location: item.location, start_date: toApiDate(item.start_date), end_date: toApiDate(item.end_date) }) })),
    ...cvData.skills.map((item) => request(`/api/resumes/${resumeId}/skills`, { method: 'POST', body: JSON.stringify({ name: item.name }) })),
    ...cvData.languages.map((item) => request(`/api/resumes/${resumeId}/languages`, { method: 'POST', body: JSON.stringify({ name: item.name, proficiency: item.proficiency }) })),
    ...cvData.projects.map((item) => request(`/api/resumes/${resumeId}/projects`, { method: 'POST', body: JSON.stringify({ name: item.name, description: item.description, url: item.url, tech_stack: item.tech_stack ? { value: item.tech_stack } : {} }) })),
  ])
  return resumeId
}

export async function loadResume(id: number): Promise<ResumeDraft> {
  const [{ resume }, experiences, educations, skills, languages, projects] = await Promise.all([
    request<{ resume: Record<string, unknown> }>(`/api/resumes/${id}`),
    request<{ items: Experience[] }>(`/api/resumes/${id}/experiences`),
    request<{ items: Education[] }>(`/api/resumes/${id}/educations`),
    request<{ items: Skill[] }>(`/api/resumes/${id}/skills`),
    request<{ items: Language[] }>(`/api/resumes/${id}/languages`),
    request<{ items: Project[] }>(`/api/resumes/${id}/projects`),
  ])
  return { ...resume, id, full_name: '', email: '', phone: '', location: '', experiences: experiences.items.map((item) => ({ ...item, start_date: toMonth(item.start_date), end_date: toMonth(item.end_date) })), educations: educations.items.map((item) => ({ ...item, start_date: toMonth(item.start_date), end_date: toMonth(item.end_date) })), skills: skills.items, languages: languages.items, projects: projects.items } as ResumeDraft
}

export async function generatePdf(cvData: ResumeDraft) {
  const token = localStorage.getItem('leon_access_token')
  const resumeId = await saveResume(cvData)
  const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || `PDF request failed with ${response.status}`)
  }
  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${(cvData.full_name || 'Resume').trim().replace(/[^a-z0-9]+/gi, '_')}_Resume.pdf`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

export const api = { checkHealth, login, register, me, logout, enhanceBullet, saveResume, loadResume, generatePdf }
