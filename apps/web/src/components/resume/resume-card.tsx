import { Trash2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Resume } from '@/types';
import { useDeleteResume } from '@/hooks/use-resumes';

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? 'text-success-500' : score >= 50 ? 'text-saffron-500' : 'text-alert-500';
  return (
    <div className="text-center">
      <p className={`font-display text-2xl font-semibold ${color}`}>{score}</p>
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
    </div>
  );
}

export function ResumeCard({ resume }: { resume: Resume }) {
  const deleteResume = useDeleteResume();

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink-800">{resume.originalFileName}</p>
                {resume.isMaster && <Badge variant="accent">Master</Badge>}
              </div>
              <p className="text-xs text-ink-400">{new Date(resume.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {resume.atsScore != null && <ScoreRing score={resume.atsScore} label="ATS" />}
            {resume.resumeScore != null && <ScoreRing score={resume.resumeScore} label="Quality" />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteResume.mutate(resume.id)}
              aria-label="Delete resume"
            >
              <Trash2 className="h-4 w-4 text-ink-300 hover:text-alert-500" />
            </Button>
          </div>
        </div>

        {resume.parsedSummary && (
          <p className="mt-4 text-sm text-ink-600">{resume.parsedSummary}</p>
        )}

        {resume.parsedSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resume.parsedSkills.slice(0, 12).map((skill) => (
              <span key={skill} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        )}

        {resume.recommendations.length > 0 && (
          <div className="mt-4 rounded-lg bg-ink-50 p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Recommendations
            </p>
            <ul className="space-y-1 text-sm text-ink-600">
              {resume.recommendations.slice(0, 4).map((rec, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-saffron-500">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
