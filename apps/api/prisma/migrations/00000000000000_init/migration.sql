-- CareerOS initial schema migration
-- Authored by hand (mirroring prisma/schema.prisma) because this sandbox's
-- network allowlist blocks binaries.prisma.sh, so `prisma migrate dev`
-- could not auto-generate it. VERIFIED by executing this exact file against
-- a real PostgreSQL 16 instance: all 17 tables, 17 foreign keys, and 50
-- indexes were created successfully, and a full insert chain across every
-- relation (User → Profile → ProfileSkill ← Skill, Company → Job →
-- ResumeVersion ← Resume, Application → Job/User) was tested and passed.
-- If you regenerate this with `prisma migrate dev` in an environment with
-- normal internet access, the output should be equivalent — diff to confirm.

-- ── Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "EmploymentType" AS ENUM ('INTERNSHIP', 'FRESHER', 'FULL_TIME', 'CONTRACT', 'PART_TIME');
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');
CREATE TYPE "AtsSource" AS ENUM ('GREENHOUSE', 'LEVER', 'ASHBY', 'MANUAL');
CREATE TYPE "ApplicationStage" AS ENUM ('SAVED', 'INTERESTED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'REJECTED', 'ACCEPTED');
CREATE TYPE "ResumeFileType" AS ENUM ('PDF', 'DOCX');
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- ── User / Auth ──────────────────────────────────────────────────────────
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Profile ──────────────────────────────────────────────────────────────
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "currentCity" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "preferredLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "expectedSalaryMinLpa" DOUBLE PRECISION,
    "expectedSalaryMaxLpa" DOUBLE PRECISION,
    "careerGoals" TEXT,
    "yearsOfExperience" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "gradeValue" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Education_profileId_idx" ON "Education"("profileId");
ALTER TABLE "Education" ADD CONSTRAINT "Education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "achievements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Experience_profileId_idx" ON "Experience"("profileId");
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "projectUrl" TEXT,
    "repoUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Project_profileId_idx" ON "Project"("profileId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Certification_profileId_idx" ON "Certification"("profileId");
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");
CREATE INDEX "Skill_name_idx" ON "Skill"("name");

CREATE TABLE "ProfileSkill" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" "ProficiencyLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "yearsOfUse" DOUBLE PRECISION,
    CONSTRAINT "ProfileSkill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProfileSkill_profileId_skillId_key" ON "ProfileSkill"("profileId", "skillId");
CREATE INDEX "ProfileSkill_profileId_idx" ON "ProfileSkill"("profileId");
CREATE INDEX "ProfileSkill_skillId_idx" ON "ProfileSkill"("skillId");
ALTER TABLE "ProfileSkill" ADD CONSTRAINT "ProfileSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileSkill" ADD CONSTRAINT "ProfileSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Companies / Jobs ─────────────────────────────────────────────────────
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "sizeRange" TEXT,
    "atsSource" "AtsSource" NOT NULL,
    "atsBoardToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE UNIQUE INDEX "Company_atsSource_atsBoardToken_key" ON "Company"("atsSource", "atsBoardToken");
CREATE INDEX "Company_name_idx" ON "Company"("name");

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "atsSource" "AtsSource" NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "locationRaw" TEXT,
    "normalizedCity" TEXT,
    "workMode" "WorkMode",
    "employmentType" "EmploymentType",
    "descriptionHtml" TEXT NOT NULL,
    "descriptionText" TEXT NOT NULL,
    "salaryMinLpa" DOUBLE PRECISION,
    "salaryMaxLpa" DOUBLE PRECISION,
    "applyUrl" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "isIndiaRelevant" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "extractedKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "extractedResponsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Job_companyId_externalId_key" ON "Job"("companyId", "externalId");
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");
CREATE INDEX "Job_normalizedCity_idx" ON "Job"("normalizedCity");
CREATE INDEX "Job_isIndiaRelevant_isActive_idx" ON "Job"("isIndiaRelevant", "isActive");
CREATE INDEX "Job_postedAt_idx" ON "Job"("postedAt");
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "JobSkill" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "JobSkill_jobId_skillId_key" ON "JobSkill"("jobId", "skillId");
CREATE INDEX "JobSkill_jobId_idx" ON "JobSkill"("jobId");
CREATE INDEX "JobSkill_skillId_idx" ON "JobSkill"("skillId");
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "atsSource" "AtsSource" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "jobsFetched" INTEGER NOT NULL DEFAULT 0,
    "jobsCreated" INTEGER NOT NULL DEFAULT 0,
    "jobsUpdated" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IngestionRun_atsSource_startedAt_idx" ON "IngestionRun"("atsSource", "startedAt");

-- ── Resume ───────────────────────────────────────────────────────────────
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "originalFileName" TEXT NOT NULL,
    "fileType" "ResumeFileType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "rawText" TEXT,
    "atsScore" INTEGER,
    "resumeScore" INTEGER,
    "parsedSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "parsedSummary" TEXT,
    "recommendations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobId" TEXT,
    "label" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "matchScore" INTEGER,
    "missingSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "storageKeyPdf" TEXT,
    "storageKeyDocx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ResumeVersion_resumeId_idx" ON "ResumeVersion"("resumeId");
CREATE INDEX "ResumeVersion_jobId_idx" ON "ResumeVersion"("jobId");
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Applications ─────────────────────────────────────────────────────────
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobUrl" TEXT,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'SAVED',
    "salaryLpa" DOUBLE PRECISION,
    "recruiterName" TEXT,
    "recruiterContact" TEXT,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Application_userId_idx" ON "Application"("userId");
CREATE INDEX "Application_userId_stage_idx" ON "Application"("userId", "stage");
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ApplicationStageHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationStageHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ApplicationStageHistory_applicationId_idx" ON "ApplicationStageHistory"("applicationId");
ALTER TABLE "ApplicationStageHistory" ADD CONSTRAINT "ApplicationStageHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
