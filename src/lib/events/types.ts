import type { EventType } from '@prisma/client'

export interface NormalizedEvent {
  externalId: string
  title: string
  organizer: string
  type: EventType
  city: string | null
  state: string | null
  location: string
  isOnline: boolean
  description: string
  skills: string[]
  url: string
  source: string
  startsAt: Date
  endsAt: Date | null
}

export const EVENT_SOURCES = ['unstop', 'devfolio', 'luma', 'eventbrite'] as const
export type EventSource = (typeof EVENT_SOURCES)[number]

export const EVENT_SOURCE_LABELS: Record<EventSource, string> = {
  unstop: 'Unstop',
  devfolio: 'Devfolio',
  luma: 'Luma',
  eventbrite: 'Eventbrite',
}

/** Hostnames we treat as aggregators (not a direct organizer site). */
export const EVENT_AGGREGATOR_HOSTS = new Set([
  'unstop.com',
  'www.unstop.com',
  'devfolio.co',
  'www.devfolio.co',
  'lu.ma',
  'www.lu.ma',
  'luma.com',
  'eventbrite.com',
  'www.eventbrite.com',
  'eventbrite.in',
  'www.eventbrite.in',
])
