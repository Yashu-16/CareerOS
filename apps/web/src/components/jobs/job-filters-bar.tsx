'use client';

import { Input } from '@/components/ui/input';
import { useJobCities } from '@/hooks/use-jobs';
import { JobSearchFilters } from '@/hooks/use-jobs';

interface Props {
  filters: JobSearchFilters;
  onChange: (filters: JobSearchFilters) => void;
}

const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE'];
const EMPLOYMENT_TYPES = ['INTERNSHIP', 'FRESHER', 'FULL_TIME', 'CONTRACT', 'PART_TIME'];

export function JobFiltersBar({ filters, onChange }: Props) {
  const { data: cities } = useJobCities();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search job title, company, or skill…"
        className="max-w-xs"
        value={filters.q || ''}
        onChange={(e) => onChange({ ...filters, q: e.target.value, page: 1 })}
      />

      <select
        className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700"
        value={filters.city || ''}
        onChange={(e) => onChange({ ...filters, city: e.target.value || undefined, page: 1 })}
      >
        <option value="">All cities</option>
        {cities?.map((c) => (
          <option key={c.city} value={c.city}>
            {c.city} ({c.count})
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700"
        value={filters.workMode || ''}
        onChange={(e) => onChange({ ...filters, workMode: e.target.value || undefined, page: 1 })}
      >
        <option value="">Any work mode</option>
        {WORK_MODES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700"
        value={filters.employmentType || ''}
        onChange={(e) => onChange({ ...filters, employmentType: e.target.value || undefined, page: 1 })}
      >
        <option value="">Any type</option>
        {EMPLOYMENT_TYPES.map((t) => (
          <option key={t} value={t}>{t.replace('_', '-')}</option>
        ))}
      </select>
    </div>
  );
}
