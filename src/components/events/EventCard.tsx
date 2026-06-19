'use client'

import { Calendar, ExternalLink, MapPin, Users } from 'lucide-react'
import { SkillTag } from '@/components/ui/Badge'
import { formatEventDate } from '@/lib/format'
import type { CareerEventRow } from '@/types'

const TYPE_STYLES: Record<CareerEventRow['type'], string> = {
  HACKATHON: 'bg-primary-50 text-primary-700 border border-primary-200',
  NETWORKING: 'bg-blue-50 text-blue-800 border border-blue-200',
  CAREER_SOCIAL: 'bg-purple-50 text-purple-800 border border-purple-200',
  CAREER_FAIR: 'bg-success-light text-success border border-success/20',
  WORKSHOP: 'bg-warning-light text-warning border border-warning/20',
}

const TYPE_LABELS: Record<CareerEventRow['type'], string> = {
  HACKATHON: 'Hackathon',
  NETWORKING: 'Networking',
  CAREER_SOCIAL: 'Career social',
  CAREER_FAIR: 'Career fair',
  WORKSHOP: 'Workshop',
}

export function EventCard({ event }: { event: CareerEventRow }) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex text-caption font-medium px-2 py-0.5 rounded-md ${TYPE_STYLES[event.type]}`}>
            {TYPE_LABELS[event.type]}
          </span>
          <h3 className="text-h3 text-gray-900 mt-2 line-clamp-2">{event.title}</h3>
          <p className="text-body-sm text-gray-500 mt-1 truncate">{event.organizer}</p>
        </div>
      </div>

      <div className="space-y-2 mt-4 text-body-sm text-gray-600">
        <p className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0 text-primary-600" />
          {formatEventDate(event.startsAt, event.endsAt)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0 text-primary-600" />
          <span className="truncate">{event.location}</span>
        </p>
        {event.isOnline && (
          <p className="flex items-center gap-2 text-primary-700">
            <Users size={14} className="shrink-0" />
            Open to join from anywhere in India
          </p>
        )}
      </div>

      {event.description && (
        <p className="text-body-sm text-gray-500 mt-3 line-clamp-3 flex-1">{event.description}</p>
      )}

      {event.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {event.skills.slice(0, 4).map((s) => (
            <SkillTag key={s}>{s}</SkillTag>
          ))}
        </div>
      )}

      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-body-sm text-primary-700 font-medium hover:underline"
      >
        View & register <ExternalLink size={14} />
      </a>
    </article>
  )
}
