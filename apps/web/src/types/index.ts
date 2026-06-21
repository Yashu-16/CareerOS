export type EmploymentType = 'INTERNSHIP' | 'FRESHER' | 'FULL_TIME' | 'CONTRACT' | 'PART_TIME';
export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type AtsSource = 'GREENHOUSE' | 'LEVER' | 'ASHBY' | 'MANUAL';
export type ApplicationStage =
  | 'SAVED'
  | 'INTERESTED'
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'FINAL_ROUND'
  | 'OFFER'
  | 'REJECTED'
  | 'ACCEPTED';
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
}

export interface Job {
  id: string;
  title: string;
  department?: string | null;
  locationRaw?: string | null;
  normalizedCity?: string | null;
  workMode?: WorkMode | null;
  employmentType?: EmploymentType | null;
  descriptionHtml: string;
  descriptionText: string;
  salaryMinLpa?: number | null;
  salaryMaxLpa?: number | null;
  applyUrl: string;
  postedAt?: string | null;
  company: Company;
  extractedKeywords?: string[];
}

export interface JobSearchResponse {
  items: Job[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  gradeValue?: string | null;
  isCurrent: boolean;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
  achievements: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description?: string | null;
  techStack: string[];
  projectUrl?: string | null;
  repoUrl?: string | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer?: string | null;
  issueDate?: string | null;
  credentialUrl?: string | null;
}

export interface ProfileSkill {
  skill: { id: string; name: string };
  proficiency: ProficiencyLevel;
  yearsOfUse?: number | null;
}

export interface Profile {
  id: string;
  fullName?: string | null;
  phone?: string | null;
  currentCity?: string | null;
  headline?: string | null;
  summary?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  preferredLocations: string[];
  expectedSalaryMinLpa?: number | null;
  expectedSalaryMaxLpa?: number | null;
  careerGoals?: string | null;
  yearsOfExperience?: number | null;
  education: Education[];
  experience: Experience[];
  projects: ProjectEntry[];
  certifications: Certification[];
  skills: ProfileSkill[];
}

export interface Resume {
  id: string;
  isMaster: boolean;
  originalFileName: string;
  fileType: 'PDF' | 'DOCX';
  atsScore?: number | null;
  resumeScore?: number | null;
  parsedSkills: string[];
  parsedSummary?: string | null;
  recommendations: string[];
  createdAt: string;
}

export interface MatchScoreResult {
  overallScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  whyYouMatch: string[];
  suggestionsToImprove: string[];
}

export interface TailoredResumeContent {
  summary: string;
  orderedSkills: string[];
  experienceBullets: Array<{ company: string; title: string; bullets: string[] }>;
  projectHighlights: Array<{ name: string; bullets: string[] }>;
  keywordsIncorporated: string[];
}

export interface ResumeVersion {
  id: string;
  label: string;
  matchScore?: number | null;
  missingSkills: string[];
  storageKeyPdf?: string | null;
  storageKeyDocx?: string | null;
  createdAt: string;
}

export interface TailorResult {
  version: ResumeVersion;
  matchScore: MatchScoreResult;
  tailoredContent: TailoredResumeContent;
}

export interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  jobUrl?: string | null;
  stage: ApplicationStage;
  salaryLpa?: number | null;
  recruiterName?: string | null;
  recruiterContact?: string | null;
  notes?: string | null;
  appliedAt?: string | null;
  createdAt: string;
  job?: { id: string; title: string; applyUrl: string; company: { name: string; logoUrl?: string | null } } | null;
}

export type ApplicationBoard = Record<ApplicationStage, Application[]>;

export interface ApplicationAnalytics {
  totalApplications: number;
  appliedOrBeyond: number;
  interviewRate: number;
  offerRate: number;
  rejectionRate: number;
  stageCounts: Record<ApplicationStage, number>;
}
