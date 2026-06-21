import { MatchScoreResult } from '@/types';
import { TicketScoreCard } from '@/components/ui/ticket-score-card';

export function MatchScorePanel({ result }: { result: MatchScoreResult }) {
  return (
    <div className="space-y-4">
      <TicketScoreCard score={result.overallScore} label="Overall">
        <div className="grid grid-cols-3 gap-3 text-center">
          <SubScore label="Skills" value={result.skillMatchScore} />
          <SubScore label="Experience" value={result.experienceMatchScore} />
          <SubScore label="Education" value={result.educationMatchScore} />
        </div>
      </TicketScoreCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Why you match</p>
          <ul className="space-y-1.5">
            {result.whyYouMatch.map((reason, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-600">
                <span className="text-success-500">✓</span> {reason}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">To improve your odds</p>
          <ul className="space-y-1.5">
            {result.suggestionsToImprove.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-600">
                <span className="text-saffron-500">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {result.matchingSkills.map((s) => (
            <span key={s} className="skill-tag skill-tag--matched">{s}</span>
          ))}
          {result.missingSkills.map((s) => (
            <span key={s} className="skill-tag skill-tag--missing">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubScore({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold text-ink-800">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-400">{label}</p>
    </div>
  );
}
