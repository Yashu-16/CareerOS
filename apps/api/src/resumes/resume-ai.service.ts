import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../common/openai/openai.service';

export interface ParsedResumeResult {
  summary: string;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
    grade?: string;
  }>;
  experience: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description?: string;
    techStack: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer?: string;
  }>;
  achievements: string[];
  atsScore: number; // 0-100
  resumeScore: number; // 0-100
  keywordDensityIssues: string[];
  missingSections: string[];
  recommendations: string[];
}

@Injectable()
export class ResumeAiService {
  constructor(private readonly openai: OpenAiService) {}

  async parseResume(rawText: string): Promise<ParsedResumeResult> {
    const system = `You are CareerOS's resume intelligence engine, built for the Indian job market (tech, business, and general professional roles). You extract structured information from raw resume text and produce objective quality scores.

Score rubric:
- atsScore (0-100): how well an Applicant Tracking System would parse this resume — penalize tables/columns artifacts, missing section headers, missing contact info, inconsistent date formats, lack of measurable achievements, walls of text without bullets.
- resumeScore (0-100): overall resume quality for a human recruiter — clarity, quantified impact, relevance, concision, structure.

Always respond with strict JSON matching the schema described by the user. Do not invent information not present in the resume text — if a field is unclear, omit it or leave the array empty. Dates should be ISO-ish strings ("YYYY-MM" or "YYYY") where determinable.`;

    const user = `Parse the following resume text and return a single JSON object with EXACTLY these top-level keys:

{
  "summary": string (2-3 sentence professional summary inferred from the resume),
  "skills": string[] (deduplicated, normalized casing, e.g. "React.js" not "react js"),
  "education": [{ "institution": string, "degree": string, "fieldOfStudy": string|null, "startYear": number|null, "endYear": number|null, "grade": string|null }],
  "experience": [{ "company": string, "title": string, "startDate": string|null, "endDate": string|null, "isCurrent": boolean, "bullets": string[] }],
  "projects": [{ "name": string, "description": string|null, "techStack": string[] }],
  "certifications": [{ "name": string, "issuer": string|null }],
  "achievements": string[] (standout quantified accomplishments pulled from anywhere in the resume),
  "atsScore": number,
  "resumeScore": number,
  "keywordDensityIssues": string[] (e.g. "No measurable metrics in experience bullets", "Missing a dedicated Skills section"),
  "missingSections": string[] (e.g. "No certifications section", "No portfolio/GitHub link found"),
  "recommendations": string[] (3-6 specific, actionable improvements)
}

RESUME TEXT:
"""
${rawText.slice(0, 12000)}
"""`;

    return this.openai.generateJson<ParsedResumeResult>({ system, user, temperature: 0.1, maxTokens: 4000 });
  }
}
