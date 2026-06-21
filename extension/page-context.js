/** Shared helpers for detecting the job on the current ATS tab. */

function detectAtsFromUrl(url) {
  try {
    const h = new URL(url).hostname.toLowerCase()
    if (h.includes('greenhouse.io')) return 'greenhouse'
    if (h.includes('lever.co')) return 'lever'
    if (h.includes('ashbyhq.com')) return 'ashby'
    if (h.includes('workday')) return 'workday'
    if (h.includes('smartrecruiters.com')) return 'smartrecruiters'
  } catch {
    /* ignore */
  }
  return 'generic'
}

function isAtsUrl(url) {
  return detectAtsFromUrl(url) !== 'generic'
}

function normalizeApplyUrl(raw) {
  try {
    const u = new URL(raw.split('#')[0].split('?')[0])
    u.hostname = u.hostname.replace(/^job-boards\./, 'boards.')
    u.pathname = u.pathname.replace(/\/+$/, '')
    return `${u.protocol}//${u.hostname}${u.pathname}`.toLowerCase()
  } catch {
    return String(raw).toLowerCase().split('?')[0].split('#')[0]
  }
}

function scrapePageJobMeta() {
  const ats = detectAtsFromUrl(location.href)
  let title = null
  let company = null

  if (ats === 'greenhouse') {
    title =
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('[data-qa="job-title"]')?.textContent?.trim() ||
      null
    company =
      document.querySelector('.logo img')?.getAttribute('alt')?.trim() ||
      document.querySelector('[data-qa="company-name"]')?.textContent?.trim() ||
      document.querySelector('header img[alt]')?.getAttribute('alt')?.trim() ||
      null
  } else if (ats === 'lever') {
    title = document.querySelector('h2')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim()
    company = document.querySelector('.main-header-text a')?.textContent?.trim()
  } else if (ats === 'ashby') {
    title = document.querySelector('h1')?.textContent?.trim()
    company = document.querySelector('[class*="Company"]')?.textContent?.trim()
  } else {
    title = document.querySelector('h1')?.textContent?.trim()
  }

  return {
    applyUrl: location.href.split('#')[0].split('?')[0],
    normalizedUrl: normalizeApplyUrl(location.href),
    title,
    company,
    ats,
    isAtsPage: ats !== 'generic',
  }
}
