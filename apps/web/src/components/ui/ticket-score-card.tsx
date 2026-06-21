import { cn } from '@/lib/utils';

interface TicketScoreCardProps {
  score: number; // 0-100
  label?: string;
  children: React.ReactNode;
  className?: string;
}

function scoreColor(score: number) {
  if (score >= 75) return 'text-success-500';
  if (score >= 50) return 'text-saffron-500';
  return 'text-alert-500';
}

/**
 * The signature CareerOS visual device: a boarding-pass style card with a
 * perforated divider between the match score "stub" and the job details —
 * reinforcing the idea that a high score is your ticket in.
 */
export function TicketScoreCard({ score, label = 'Match', children, className }: TicketScoreCardProps) {
  return (
    <div className={cn('ticket-card animate-fade-up', className)}>
      <div className="ticket-card__stub">
        <span className={cn('font-display text-3xl font-semibold leading-none', scoreColor(score))}>
          {score}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-paper/60">{label}</span>
      </div>
      <div className="ticket-card__perforation" />
      <div className="ticket-card__body">{children}</div>
    </div>
  );
}
