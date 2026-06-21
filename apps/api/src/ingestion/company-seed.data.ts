/**
 * Seed company list for job ingestion.
 *
 * IMPORTANT — READ BEFORE RUNNING INGESTION:
 * Board tokens below are best-effort and MUST be verified before relying on them,
 * because ATS board tokens change when companies migrate, rebrand, or rotate
 * their careers page. Verify any token in 10 seconds with one curl call:
 *
 *   Greenhouse: curl -s https://boards-api.greenhouse.io/v1/boards/{token}/jobs | head -c 300
 *   Lever:      curl -s "https://api.lever.co/v0/postings/{token}?mode=json" | head -c 300
 *   Ashby:      curl -s "https://api.ashbyhq.com/posting-api/job-board/{token}" | head -c 300
 *
 * A valid token returns JSON starting with `{"jobs":[...` (Greenhouse/Ashby) or `[{"id":...` (Lever).
 * An invalid token returns a 404 or an HTML error page.
 *
 * Run `npm run verify:companies` (see scripts/verify-companies.ts) to check every
 * entry in this file against the live APIs and print a pass/fail report before
 * your first scheduled ingestion run. Remove or fix any FAIL before going live —
 * the ingestion service silently skips and logs a warning for any board that
 * 404s, so a stale token won't crash anything, but it also won't surface jobs.
 *
 * This file intentionally starts small. Grow it incrementally — verify each
 * batch of additions with the script above before merging.
 */

export type SeedAtsSource = 'GREENHOUSE' | 'LEVER' | 'ASHBY';

export interface SeedCompany {
  name: string;
  atsSource: SeedAtsSource;
  atsBoardToken: string;
  website?: string;
  industry?: string;
}

export const COMPANY_SEED_LIST: SeedCompany[] = [
  // ── Verify each of these against the live API before first run. ──
  { name: 'Postman', atsSource: 'GREENHOUSE', atsBoardToken: 'postman', website: 'https://postman.com', industry: 'Developer Tools' },
  { name: 'Razorpay', atsSource: 'LEVER', atsBoardToken: 'razorpay', website: 'https://razorpay.com', industry: 'Fintech' },
  { name: 'Chargebee', atsSource: 'GREENHOUSE', atsBoardToken: 'chargebee', website: 'https://chargebee.com', industry: 'SaaS' },
  { name: 'BrowserStack', atsSource: 'GREENHOUSE', atsBoardToken: 'browserstack', website: 'https://browserstack.com', industry: 'Developer Tools' },
  { name: 'Hasura', atsSource: 'GREENHOUSE', atsBoardToken: 'hasura', website: 'https://hasura.io', industry: 'Developer Tools' },
  { name: 'Whatfix', atsSource: 'LEVER', atsBoardToken: 'whatfix', website: 'https://whatfix.com', industry: 'SaaS' },
  { name: 'Innovaccer', atsSource: 'LEVER', atsBoardToken: 'innovaccer', website: 'https://innovaccer.com', industry: 'Healthtech' },
  { name: 'Clari', atsSource: 'GREENHOUSE', atsBoardToken: 'clari', website: 'https://clari.com', industry: 'SaaS' },
  { name: 'Zeta', atsSource: 'GREENHOUSE', atsBoardToken: 'zeta', website: 'https://zeta.tech', industry: 'Fintech' },
  { name: 'Highspot', atsSource: 'GREENHOUSE', atsBoardToken: 'highspot', website: 'https://highspot.com', industry: 'SaaS' },
];
