/**
 * Curated list of Indian companies whose career pages are powered by public
 * ATS job boards. Slugs are verified to return live postings. Add more here as
 * you expand coverage — no code changes needed elsewhere.
 */
export interface AtsCompany {
  /** The board token used in the ATS API URL. */
  slug: string
  /** Display name shown in the app (overrides whatever the board reports). */
  name: string
}

export interface WorkdayCompany {
  host: string
  tenant: string
  site: string
  name: string
}

export const GREENHOUSE_COMPANIES: AtsCompany[] = [
  { slug: 'groww', name: 'Groww' },
  { slug: 'postman', name: 'Postman' },
  { slug: 'phonepe', name: 'PhonePe' },
  { slug: 'razorpaysoftwareprivatelimited', name: 'Razorpay' },
  { slug: 'mongodb', name: 'MongoDB' },
  { slug: 'datadog', name: 'Datadog' },
  { slug: 'gitlab', name: 'GitLab' },
  { slug: 'elastic', name: 'Elastic' },
  { slug: 'stripe', name: 'Stripe' },
  { slug: 'gusto', name: 'Gusto' },
  { slug: 'affirm', name: 'Affirm' },
]

export const LEVER_COMPANIES: AtsCompany[] = [
  { slug: 'meesho', name: 'Meesho' },
  { slug: 'cred', name: 'CRED' },
  { slug: 'spotify', name: 'Spotify' },
  { slug: 'netflix', name: 'Netflix' },
  { slug: 'palantir', name: 'Palantir' },
]

export const ASHBY_COMPANIES: AtsCompany[] = [
  { slug: 'atlan', name: 'Atlan' },
  { slug: 'kong', name: 'Kong' },
  { slug: 'openai', name: 'OpenAI' },
  { slug: 'notion', name: 'Notion' },
  { slug: 'ramp', name: 'Ramp' },
]

export const SMARTRECRUITERS_COMPANIES: AtsCompany[] = [
  { slug: 'Freshworks', name: 'Freshworks' },
  { slug: 'Visa', name: 'Visa' },
  { slug: 'ThoughtWorks', name: 'ThoughtWorks' },
  { slug: 'SAP', name: 'SAP' },
  { slug: 'Ericsson', name: 'Ericsson' },
  { slug: 'Booking', name: 'Booking.com' },
  { slug: 'Dell', name: 'Dell' },
  { slug: 'Deloitte', name: 'Deloitte' },
  { slug: 'Accenture', name: 'Accenture' },
  { slug: 'Capgemini', name: 'Capgemini' },
]

/** Public Workday career sites with India postings. */
export const WORKDAY_COMPANIES: WorkdayCompany[] = [
  { host: 'nvidia.wd5.myworkdayjobs.com', tenant: 'nvidia', site: 'NVIDIAExternalCareerSite', name: 'NVIDIA' },
  { host: 'cadence.wd1.myworkdayjobs.com', tenant: 'cadence', site: 'External_Careers', name: 'Cadence' },
  { host: 'micron.wd1.myworkdayjobs.com', tenant: 'micron', site: 'External', name: 'Micron' },
]
