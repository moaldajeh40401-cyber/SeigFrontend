import type { ResumeDraft } from '../services/api'

export const defaultCV: ResumeDraft = {
  title: 'Mohammad Aldajeh Resume',
  target_role: 'Full-Stack & Mobile Developer',
  full_name: 'Mohammad Aldajeh',
  email: 'mo.aldajeh40401@gmail.com',
  phone: '0791220430',
  location: 'Amman, Jordan',
  professional_summary: 'Full-Stack Mobile Developer with 1.5 years of hands-on experience developing mobile and web applications across frontend, backend, databases, and APIs. Senior Computer Information Systems student at the University of Jordan - Aqaba and Tech Team Leader at the IEEE Student Branch. Experienced in leading technical teams, coordinating projects, and developing practical software solutions. Passionate about building scalable, user-focused applications while combining technical expertise with leadership and teamwork.',
  linkedin_url: 'https://www.linkedin.com/in/m0hmad-aldajah',
  github_url: '',
  portfolio_url: 'https://portfolio-steel-three-37.vercel.app/',
  experiences: [
    {
      id: 'exp-freelance',
      company: 'Freelance',
      job_title: 'Freelance Mobile Developer',
      location: 'Amman, Jordan',
      start_date: '2025-06',
      end_date: '',
      is_current: true,
      achievements: [
        'Developed and maintained cross-platform mobile applications based on client requirements and project specifications.',
        'Designed responsive, user-friendly interfaces focused on performance, accessibility, and practical usability.',
        'Developed and integrated RESTful APIs and backend services to support reliable mobile application functionality.',
        'Implemented database integration, authentication, data management, and third-party service integrations.',
        'Debugged, tested, and optimized applications to improve performance, reliability, and overall user experience.',
        'Communicated directly with clients to gather requirements, provide updates, and deliver solutions within deadlines.',
      ],
    },
  ],
  educations: [
    {
      id: 'edu-cis',
      institution: 'University of Jordan - Aqaba Branch',
      degree: 'Bachelor of Computer Information Systems',
      field_of_study: 'Computer Information Systems',
      location: 'Aqaba, Jordan',
      start_date: '2024-10',
      end_date: '',
    },
  ],
  skills: [
    {
      id: 'skill-core',
      name: 'Flutter, Dart, Python, Flask, REST APIs, SQL, PostgreSQL, Firebase, Authentication, Database Integration, Responsive UI, Testing, Debugging, Git, Qwen, Technical Leadership',
    },
  ],
  languages: [
    { id: 'language-arabic', name: 'Arabic', proficiency: 'Native' },
    { id: 'language-english', name: 'English', proficiency: 'C1 Advanced' },
  ],
  projects: [
    {
      id: 'project-seig',
      name: 'Seig - AI-Powered ATS Resume Builder',
      description: 'Built an ATS-focused resume builder with a Flutter client, Flask backend, REST APIs, and Qwen-powered content enhancement for structured recruitment-ready documents.',
      url: 'https://seigbackend.onrender.com/',
      tech_stack: 'Flutter, Python, Flask, RESTful API, Qwen',
    },
    {
      id: 'project-hustler',
      name: 'Hustler - Personal Finance Management App',
      description: 'Developed a personal finance application for university dorm students with financial charts, spending insights, and Flask APIs for data management.',
      url: '',
      tech_stack: 'Flutter, Python, Flask, RESTful API',
    },
  ],
}

export function createEmptyCV(): ResumeDraft {
  return {
    ...defaultCV,
    title: '', target_role: '', full_name: '', email: '', phone: '', location: '', professional_summary: '', linkedin_url: '', github_url: '', portfolio_url: '',
    experiences: [], educations: [], skills: [], languages: [], projects: [],
  }
}
