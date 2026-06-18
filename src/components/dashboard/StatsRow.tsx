import { StatCard } from '@/components/ui/Card'
import { Send, CalendarCheck, Trophy, Gauge } from 'lucide-react'

export function StatsRow({
  applied,
  interviews,
  offers,
  atsScore,
}: {
  applied: number
  interviews: number
  offers: number
  atsScore?: number | null
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Applications" value={applied} icon={<Send size={16} className="text-primary-600" />} />
      <StatCard label="Interviews" value={interviews} icon={<CalendarCheck size={16} className="text-warning" />} />
      <StatCard label="Offers" value={offers} accent="text-success" icon={<Trophy size={16} className="text-success" />} />
      <StatCard
        label="ATS Score"
        value={atsScore != null ? `${atsScore}` : '—'}
        accent={atsScore != null ? (atsScore >= 70 ? 'text-success' : atsScore >= 40 ? 'text-warning' : 'text-danger') : 'text-gray-500'}
        icon={<Gauge size={16} className="text-ai" />}
      />
    </div>
  )
}
