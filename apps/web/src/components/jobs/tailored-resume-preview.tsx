import { Download } from 'lucide-react';
import { TailoredResumeContent, ResumeVersion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { downloadResumeVersion } from '@/hooks/use-tailoring';

export function TailoredResumePreview({
  content,
  version,
}: {
  content: TailoredResumeContent;
  version: ResumeVersion;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-ink-800">Tailored resume</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadResumeVersion(version.id, 'pdf', accessToken)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadResumeVersion(version.id, 'docx', accessToken)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> DOCX
            </Button>
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-600">{content.summary}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {content.orderedSkills.slice(0, 14).map((s) => (
            <span key={s} className="skill-tag">{s}</span>
          ))}
        </div>

        {content.experienceBullets.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">Experience</p>
            {content.experienceBullets.map((exp, i) => (
              <div key={i} className="mb-3">
                <p className="text-sm font-medium text-ink-800">{exp.title} — {exp.company}</p>
                <ul className="mt-1 space-y-0.5">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-ink-600">• {b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
