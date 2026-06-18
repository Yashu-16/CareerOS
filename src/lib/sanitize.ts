/**
 * Server-side text escaping for any user-provided string that may later be
 * rendered. Strips angle brackets and trims. For rich HTML, use the
 * isomorphic-dompurify client/server sanitizer instead.
 */
export function escapeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

export function clamp(input: string, max: number): string {
  return input.length > max ? input.slice(0, max) : input
}
