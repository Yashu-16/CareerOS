'use client';

import Link from 'next/link';
import { Briefcase, FileText, KanbanSquare, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useApplicationAnalytics } from '@/hooks/use-applications';
import { useResumes } from '@/hooks/use-resumes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: analytics } = useApplicationAnalytics();
  const { data: resumes } = useResumes();

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const masterResume = resumes?.find((r) => r.isMaster);

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-semibold text-ink-800">Hey {firstName}.</h1>
      <p className="mt-1 text-ink-400">Here's where your search stands today.</p>

      {!masterResume && (
        <Card className="mt-6 border-saffron-300 bg-saffron-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-ink-800">Upload your master resume to get started</p>
              <p className="text-sm text-ink-500">CareerOS needs this once — then it tailors a version for every job you open.</p>
            </div>
            <Button asChild variant="accent">
              <Link href="/resumes">Upload resume</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Briefcase}
          label="Applications sent"
          value={analytics?.appliedOrBeyond ?? '—'}
        />
        <StatCard
          icon={TrendingUp}
          label="Interview rate"
          value={analytics ? `${analytics.interviewRate}%` : '—'}
        />
        <StatCard
          icon={KanbanSquare}
          label="Offer rate"
          value={analytics ? `${analytics.offerRate}%` : '—'}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-saffron-500" /> Find your next role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-500">
              Real, live postings from Greenhouse, Lever, and Ashby — filtered to India.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-saffron-500" /> Sharpen your resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-500">
              Get your ATS score, missing-skill analysis, and tailored versions per job.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/resumes">View resumes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-ink-800">{value}</p>
          <p className="text-xs text-ink-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
