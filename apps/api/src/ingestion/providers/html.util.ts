import { EmploymentType } from '@prisma/client';

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function inferEmploymentType(title: string, descriptionText: string): EmploymentType | undefined {
  const haystack = `${title} ${descriptionText}`.toLowerCase();

  if (/\bintern(ship)?\b/.test(haystack)) return EmploymentType.INTERNSHIP;
  if (/\bcontract(or)?\b|\bfreelance\b/.test(haystack)) return EmploymentType.CONTRACT;
  if (/\bpart[\s-]?time\b/.test(haystack)) return EmploymentType.PART_TIME;
  if (/\bfresher\b|\bnew grad(uate)?\b|\bentry[\s-]level\b|\b0[\s-]?1 years?\b/.test(haystack)) {
    return EmploymentType.FRESHER;
  }
  return EmploymentType.FULL_TIME;
}
