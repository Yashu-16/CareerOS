import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../common/openai/openai.service';

export interface JobAnalysis {
  extractedKeywords: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  seniorityLevel: string;
}

export interface MatchScoreResult {
  overallScore: number; // 0-100
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

export interface ProfileSnapshot {
  fullName: string;
  headline?: string;
  summary?: string;
  yearsOfExperience?: number;
  skills: string[];
  education: Array<{ institution: string; degree: string; fieldOfStudy?: string }>;
  experience: Array<{ company: string; title: string; description?: string; achievements: string[] }>;
  projects: Array<{ name: string; description?: string; techStack: string[] }>;
  certifications: Array<{ name: string; issuer?: string }>;
}

@Injectable()
export class TailoringAiService {
  constructor(private readonly openai: OpenAiService) {}

  async analyzeJob(jobTitle: string, descriptionText: string): Promise<JobAnalysis> {
    const system = `You are CareerOS's job analysis engine for the Indian job market. You extract structured signal from raw job descriptions so they can be matched against candidate profiles.`;

    const user = `Analyze this job posting and return a single JSON object with EXACTLY these keys:
{
  "extractedKeywords": string[] (all important ATS keywords — tools, technologies, methodologies, certifications mentioned),
  "requiredSkills": string[] (must-have skills explicitly stated as required/must-have),
  "niceToHaveSkills": string[] (skills mentioned as preferred/bonus/nice-to-have),
  "responsibilities": string[] (key day-to-day responsibilities, 4-8 items),
  "seniorityLevel": string (one of: "Internship", "Entry-level/Fresher", "Mid-level", "Senior", "Lead/Principal", "Manager+")
}

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
"""
${descriptionText.slice(0, 8000)}
"""`;

    return this.openai.generateJson<JobAnalysis>({ system, user, temperature: 0.1, maxTokens: 2000 });
  }

  async computeMatchScore(analysis: JobAnalysis, profile: ProfileSnapshot): Promise<MatchScoreResult> {
    const system = `You are CareerOS's job-matching engine for the Indian job market. You objectively score how well a candidate profile matches a job's requirements. Be honest and specific — do not inflate scores. A candidate missing several required skills should score lower on skillMatchScore even if their general profile looks strong.`;

    const user = `Given this job analysis and candidate profile, return a single JSON object with EXACTLY these keys:
{
  "overallScore": number (0-100, weighted overall fit),
  "skillMatchScore": number (0-100, based on required/nice-to-have skill overlap),
  "experienceMatchScore": number (0-100, based on years of experience and relevance of past roles),
  "educationMatchScore": number (0-100, based on degree/field relevance — if the role doesn't specify education requirements, default to 80),
  "matchingSkills": string[] (skills the candidate has that the job wants),
  "missingSkills": string[] (required or nice-to-have skills the candidate is missing),
  "whyYouMatch": string[] (3-5 specific, concrete reasons this candidate is a good fit, referencing their actual experience/projects),
  "suggestionsToImprove": string[] (3-5 specific, actionable suggestions to become a stronger candidate for this role)
}

JOB ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}`;

    return this.openai.generateJson<MatchScoreResult>({ system, user, temperature: 0.1, maxTokens: 2500 });
  }

  async generateTailoredResume(
    analysis: JobAnalysis,
    matchScore: MatchScoreResult,
    profile: ProfileSnapshot,
  ): Promise<TailoredResumeContent> {
    const system = `You are CareerOS's resume tailoring engine for the Indian job market. You rewrite resume content to align with a specific job, WITHOUT inventing facts. You may rephrase, reorder, and emphasize, but every skill, achievement, and experience must come from the candidate's actual profile data. Naturally weave in relevant ATS keywords from the job analysis where the candidate genuinely has that experience — never claim a skill the candidate doesn't have.`;

    const user = `Produce a tailored resume content structure as a single JSON object with EXACTLY these keys:
{
  "summary": string (2-3 sentence professional summary tailored to this specific job, using the candidate's real background),
  "orderedSkills": string[] (the candidate's actual skills, reordered so the most job-relevant skills come first),
  "experienceBullets": [{ "company": string, "title": string, "bullets": string[] }] (rewrite each experience entry's bullets to emphasize relevance to this job; reorder bullets within each entry by relevance; keep all facts truthful),
  "projectHighlights": [{ "name": string, "bullets": string[] }] (select and rewrite the most relevant 2-4 projects as bullet points),
  "keywordsIncorporated": string[] (the ATS keywords from the job analysis that were naturally incorporated into the tailored content above)
}

JOB ANALYSIS:
${JSON.stringify(analysis, null, 2)}

MATCH SCORE CONTEXT:
${JSON.stringify(matchScore, null, 2)}

CANDIDATE PROFILE (source of truth — do not invent anything outside this):
${JSON.stringify(profile, null, 2)}`;

    return this.openai.generateJson<TailoredResumeContent>({ system, user, temperature: 0.3, maxTokens: 3000 });
  }

  async generateCoverLetter(
    jobTitle: string,
    companyName: string,
    analysis: JobAnalysis,
    profile: ProfileSnapshot,
  ): Promise<string> {
    const system = `You are CareerOS's cover letter writer for the Indian job market. You write concise, specific, non-generic cover letters (250-350 words) grounded entirely in the candidate's real background. No clichés like "I am writing to express my interest." Open with something specific and genuine.`;

    const user = `Write a cover letter for this candidate applying to "${jobTitle}" at ${companyName}.

JOB ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

Return plain text only, no markdown formatting, no placeholder brackets like [Your Name] — use the candidate's actual name from the profile.`;

    return this.openai.generateText({ system, user, temperature: 0.5, maxTokens: 600 });
  }

  async generateInterviewAnswer(
    question: string,
    jobTitle: string,
    companyName: string,
    profile: ProfileSnapshot,
  ): Promise<string> {
    const system = `You are CareerOS's AI application assistant. You write first-person answers to job application questions, grounded entirely in the candidate's real profile data. Never invent experience. Keep answers concise (100-180 words) and specific, citing real projects/experience from the profile where relevant.`;

    const user = `Question: "${question}"
Job: ${jobTitle} at ${companyName}

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

Return plain text only — the answer itself, first person, no preamble.`;

    return this.openai.generateText({ system, user, temperature: 0.5, maxTokens: 400 });
  }
}
