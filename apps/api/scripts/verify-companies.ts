/**
 * Run with: npx ts-node scripts/verify-companies.ts
 *
 * Hits the real Greenhouse/Lever/Ashby public APIs for every entry in
 * company-seed.data.ts and prints PASS/FAIL with the live job count.
 * No database or server needed — this is a pure network sanity check,
 * meant to be run before your first ingestion so you know exactly which
 * seed tokens are live right now versus which need fixing.
 */
import { COMPANY_SEED_LIST, SeedCompany } from '../src/ingestion/company-seed.data';

async function verifyGreenhouse(token: string): Promise<{ ok: boolean; count?: number; status: number }> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`);
  if (!res.ok) return { ok: false, status: res.status };
  const data = await res.json();
  return { ok: Array.isArray(data.jobs), count: data.jobs?.length, status: res.status };
}

async function verifyLever(token: string): Promise<{ ok: boolean; count?: number; status: number }> {
  const res = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`);
  if (!res.ok) return { ok: false, status: res.status };
  const data = await res.json();
  return { ok: Array.isArray(data), count: data.length, status: res.status };
}

async function verifyAshby(token: string): Promise<{ ok: boolean; count?: number; status: number }> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${token}`);
  if (!res.ok) return { ok: false, status: res.status };
  const data = await res.json();
  return { ok: Array.isArray(data.jobs), count: data.jobs?.length, status: res.status };
}

async function verifyOne(company: SeedCompany) {
  try {
    let result;
    if (company.atsSource === 'GREENHOUSE') result = await verifyGreenhouse(company.atsBoardToken);
    else if (company.atsSource === 'LEVER') result = await verifyLever(company.atsBoardToken);
    else result = await verifyAshby(company.atsBoardToken);

    const label = `${company.name.padEnd(20)} [${company.atsSource.padEnd(10)}] token="${company.atsBoardToken}"`;
    if (result.ok) {
      console.log(`✅ PASS  ${label}  → ${result.count} live jobs`);
    } else {
      console.log(`❌ FAIL  ${label}  → HTTP ${result.status}`);
    }
  } catch (err) {
    console.log(`⚠️  ERROR ${company.name} (${company.atsBoardToken}): ${(err as Error).message}`);
  }
}

async function main() {
  console.log(`Verifying ${COMPANY_SEED_LIST.length} seed companies against live ATS APIs...\n`);
  for (const company of COMPANY_SEED_LIST) {
    await verifyOne(company);
  }
  console.log('\nDone. Fix or remove any FAIL/ERROR entries in company-seed.data.ts before running ingestion.');
}

main();
