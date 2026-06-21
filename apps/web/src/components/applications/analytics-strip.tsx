import { ApplicationAnalytics } from '@/types';

export function AnalyticsStrip({ analytics }: { analytics: ApplicationAnalytics }) {
  return (
    <div className="flex gap-6 rounded-lg border border-ink-100 bg-white px-5 py-3">
      <Stat label="Total" value={analytics.totalApplications} />
      <Stat label="Applied+" value={analytics.appliedOrBeyond} />
      <Stat label="Interview rate" value={`${analytics.interviewRate}%`} />
      <Stat label="Offer rate" value={`${analytics.offerRate}%`} />
      <Stat label="Rejection rate" value={`${analytics.rejectionRate}%`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-lg font-semibold text-ink-800">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
    </div>
  );
}
