'use client';

import { useProfile } from '@/hooks/use-profile';
import { ProfileBasicsForm } from '@/components/profile/profile-basics-form';
import { EducationSection } from '@/components/profile/education-section';
import { ExperienceSection } from '@/components/profile/experience-section';
import { ProjectsSection, CertificationsSection } from '@/components/profile/projects-certifications-section';
import { SkillsSection } from '@/components/profile/skills-section';

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return <p className="text-sm text-ink-400">Loading your profile…</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-800">Your profile</h1>
        <p className="mt-1 text-ink-400">
          This is the single source of truth CareerOS uses for matching, tailoring, and autofill.
        </p>
      </div>

      <ProfileBasicsForm profile={profile} />
      <EducationSection education={profile.education} />
      <ExperienceSection experience={profile.experience} />
      <ProjectsSection projects={profile.projects} />
      <CertificationsSection certifications={profile.certifications} />
      <SkillsSection skills={profile.skills} />
    </div>
  );
}
