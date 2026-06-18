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

export const GREENHOUSE_COMPANIES: AtsCompany[] = [
  { slug: 'groww', name: 'Groww' },
  { slug: 'postman', name: 'Postman' },
  { slug: 'phonepe', name: 'PhonePe' },
  { slug: 'razorpaysoftwareprivatelimited', name: 'Razorpay' },
]

export const LEVER_COMPANIES: AtsCompany[] = [
  { slug: 'meesho', name: 'Meesho' },
  { slug: 'cred', name: 'CRED' },
]

export const ASHBY_COMPANIES: AtsCompany[] = [
  { slug: 'atlan', name: 'Atlan' },
  { slug: 'kong', name: 'Kong' },
]

export const SMARTRECRUITERS_COMPANIES: AtsCompany[] = [
  { slug: 'Freshworks', name: 'Freshworks' },
  { slug: 'Visa', name: 'Visa' },
]
