import type {
  Job,
  Application,
  ATSReport,
  Resume,
  User,
  ChatMessage,
  ApplicationStatus,
} from '@prisma/client'

export type { Job, Application, ATSReport, Resume, User, ChatMessage, ApplicationStatus }

export interface JobWithMatch extends Job {
  matchScore?: number
}

export interface ApplicationWithJob extends Application {
  job: Job
}

export interface ATSSuggestion {
  section: 'Experience' | 'Skills' | 'Education' | 'Summary'
  original: string
  suggested: string
  reason: string
}

export interface ChatMessageInput {
  role: 'user' | 'assistant'
  content: string
}

export interface CareerEvent {
  id: string
  title: string
  company: string
  type: 'WEBINAR' | 'HACKATHON' | 'JOB_FAIR' | 'WORKSHOP'
  date: string
  location: string
  url: string
  description: string
}
