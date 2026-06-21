/**
 * CareerOS Autofill — comprehensive form filler for ATS application pages.
 * Fills text inputs, textareas, selects, radios, and checkboxes from profile fieldRules.
 */

// ─── DOM helpers ─────────────────────────────────────────────────────────────

function getFieldHaystack(el) {
  const label =
    el.labels?.[0]?.textContent ||
    el.closest('label')?.textContent ||
    el.getAttribute('aria-labelledby')
      ? document.getElementById(el.getAttribute('aria-labelledby'))?.textContent
      : ''
  const legend = el.closest('fieldset')?.querySelector('legend')?.textContent || ''
  const parent = el.closest('[class*="field"], [class*="question"], [class*="form-group"], .application-field')
  const parentText = parent?.querySelector('label, .label, h3, h4, p')?.textContent || ''
  return `${el.name} ${el.id} ${el.placeholder} ${el.getAttribute('aria-label') || ''} ${label} ${legend} ${parentText}`.toLowerCase()
}

function isFillable(el) {
  if (!el || el.disabled || el.readOnly) return false
  const type = (el.type || '').toLowerCase()
  if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'image' || type === 'reset') return false
  if (el.offsetParent === null && type !== 'radio' && type !== 'checkbox') {
    // still try visible-ish fields in modals
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
  }
  return true
}

function getAllDocuments() {
  const docs = [document]
  for (const iframe of document.querySelectorAll('iframe')) {
    try {
      if (iframe.contentDocument) docs.push(iframe.contentDocument)
    } catch {
      /* cross-origin */
    }
  }
  return docs
}

function getAllFields(root = document) {
  return [...root.querySelectorAll('input, textarea, select')].filter(isFillable)
}

function hasValue(el) {
  const type = (el.type || '').toLowerCase()
  if (type === 'checkbox' || type === 'radio') return el.checked
  if (el.tagName === 'SELECT') return el.value && el.value !== '' && el.selectedIndex > 0
  return Boolean(el.value?.trim())
}

function setNativeValue(el, value) {
  if (!el || value == null || value === '') return false
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('blur', { bubbles: true }))
  return true
}

function scoreOption(text, value) {
  const t = text.toLowerCase().trim()
  const v = value.toLowerCase().trim()
  if (!t || !v) return 0
  if (t === v) return 100
  if (t.includes(v) || v.includes(t)) return 80
  // yes/no shortcuts
  if ((v === 'yes' || v === 'no') && (t === v || t.startsWith(v))) return 90
  if (v === 'male' && t === 'male') return 100
  if (v === 'female' && t === 'female') return 100
  if (v.includes('fresher') && t.includes('fresher')) return 85
  if (v.includes('immediate') && t.includes('immediate')) return 85
  return 0
}

function setSelectValue(el, value) {
  if (!el || el.tagName !== 'SELECT' || !value) return false
  const opts = [...el.options]
  let best = null
  let bestScore = 0
  for (const opt of opts) {
    const s = Math.max(scoreOption(opt.textContent || '', value), scoreOption(opt.value || '', value))
    if (s > bestScore) {
      bestScore = s
      best = opt
    }
  }
  if (!best || bestScore < 50) return false
  el.value = best.value
  el.selectedIndex = opts.indexOf(best)
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('input', { bubbles: true }))
  return true
}

function setCheckbox(el, checked = true) {
  if (!el || el.type !== 'checkbox') return false
  if (el.checked === checked) return false
  el.checked = checked
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.dispatchEvent(new Event('click', { bubbles: true }))
  return true
}

function setRadioByValue(name, value, root = document) {
  if (!name || !value) return false
  const radios = [...root.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`)]
  if (!radios.length) return false
  let best = null
  let bestScore = 0
  for (const r of radios) {
    const hay = `${r.value} ${r.labels?.[0]?.textContent || ''}`.toLowerCase()
    const s = Math.max(scoreOption(hay, value), scoreOption(r.value, value))
    if (s > bestScore) {
      bestScore = s
      best = r
    }
  }
  if (!best || bestScore < 40) {
    // fallback: yes/no for authorization questions
    if (/^yes$/i.test(value)) best = radios.find((r) => /yes|true|authorized/i.test(r.value + r.labels?.[0]?.textContent))
    if (/^no$/i.test(value)) best = radios.find((r) => /^no$|false|not require/i.test(r.value + r.labels?.[0]?.textContent))
  }
  if (!best) return false
  best.checked = true
  best.dispatchEvent(new Event('change', { bubbles: true }))
  best.dispatchEvent(new Event('click', { bubbles: true }))
  return true
}

function applyFieldValue(el, value) {
  if (!value?.trim()) return false
  const type = (el.type || '').toLowerCase()
  if (el.tagName === 'SELECT') return setSelectValue(el, value)
  if (type === 'checkbox') {
    if (/agree|consent|accept|terms|privacy|acknowledge/i.test(getFieldHaystack(el))) return setCheckbox(el, true)
    if (/yes|authorized|eligible/i.test(value)) return setCheckbox(el, true)
    return false
  }
  if (type === 'radio') return setRadioByValue(el.name, value, el.getRootNode() === document ? document : document)
  if (type === 'file') return false
  if (type === 'email' && !value.includes('@')) return false
  return setNativeValue(el, value)
}

// ─── Rule matching ───────────────────────────────────────────────────────────

function ruleMatches(el, rule) {
  const hay = getFieldHaystack(el)
  if (!hay.trim()) return 0
  if (rule.exclude?.some((ex) => hay.includes(ex))) return 0
  let score = 0
  for (const kw of rule.keywords) {
    if (hay.includes(kw)) score = Math.max(score, (rule.priority || 50) + kw.length)
  }
  return score
}

function bestRuleForField(el, rules) {
  let best = null
  let bestScore = 0
  for (const rule of rules) {
    const s = ruleMatches(el, rule)
    if (s > bestScore) {
      bestScore = s
      best = rule
    }
  }
  return bestScore >= 55 ? best : null
}

// ─── ATS-specific ID fills ───────────────────────────────────────────────────

const ATS_IDS = {
  greenhouse: {
    first_name: 'firstName',
    last_name: 'lastName',
    email: 'email',
    phone: 'phone',
  },
}

function profileKey(profile, key) {
  const v = profile[key]
  return v == null ? '' : String(v)
}

function fillByIds(profile, idMap) {
  let n = 0
  for (const [id, key] of Object.entries(idMap)) {
    const el = document.getElementById(id)
    const val = profileKey(profile, key)
    if (el && val && applyFieldValue(el, val)) n++
  }
  return n
}

function greenhouseFill(profile) {
  let n = fillByIds(profile, ATS_IDS.greenhouse)
  // Greenhouse custom question textareas
  const textareas = document.querySelectorAll('textarea[id*="job_application_answers"], textarea[name*="answers"]')
  const longAnswer = profile.bio || profile.workExperienceText || profile.resumeText?.slice(0, 2000)
  for (const ta of textareas) {
    if (!hasValue(ta) && longAnswer && applyFieldValue(ta, longAnswer)) n++
  }
  // Education fields on some Greenhouse forms
  n += fillByIds(profile, {
    education_school_name: 'college',
    education_degree: 'degree',
    education_end_date_year: 'graduationYear',
  })
  return n
}

function leverFill(profile) {
  let n = 0
  const map = [
    ['input[name="name"]', profile.fullName],
    ['input[name="email"]', profile.email],
    ['input[name="phone"]', profile.phone],
    ['input[name*="urls[LinkedIn]"]', profile.linkedinUrl],
    ['input[name*="urls[GitHub]"]', profile.githubUrl],
    ['textarea[name="comments"]', profile.bio],
  ]
  for (const [sel, val] of map) {
    const el = document.querySelector(sel)
    if (el && val && !hasValue(el) && applyFieldValue(el, val)) n++
  }
  return n
}

function ashbyFill(profile) {
  let n = 0
  const map = [
    ['input[name="_systemfield_name"]', profile.fullName],
    ['input[name="_systemfield_email"]', profile.email],
    ['input[name="_systemfield_phone"]', profile.phone],
    ['input[name*="linkedin"]', profile.linkedinUrl],
  ]
  for (const [sel, val] of map) {
    const el = document.querySelector(sel)
    if (el && val && !hasValue(el) && applyFieldValue(el, val)) n++
  }
  return n
}

function detectAts() {
  const h = location.hostname
  if (h.includes('greenhouse.io')) return 'greenhouse'
  if (h.includes('lever.co')) return 'lever'
  if (h.includes('ashbyhq.com')) return 'ashby'
  if (h.includes('workday')) return 'workday'
  if (h.includes('smartrecruiters')) return 'smartrecruiters'
  return 'generic'
}

function atsSpecificFill(profile, ats) {
  switch (ats) {
    case 'greenhouse':
      return greenhouseFill(profile)
    case 'lever':
      return leverFill(profile)
    case 'ashby':
      return ashbyFill(profile)
    default:
      return 0
  }
}

// ─── Comprehensive fill engine ─────────────────────────────────────────────

function fillFromRules(profile) {
  const rules = profile.fieldRules || buildFallbackRules(profile)
  const filledEls = new WeakSet()
  let filled = 0

  for (const doc of getAllDocuments()) {
    const fields = getAllFields(doc)
    // Sort: empty fields first, then by DOM order
    const candidates = fields
      .filter((el) => !hasValue(el))
      .map((el) => {
        const rule = bestRuleForField(el, rules)
        return { el, rule, score: rule ? ruleMatches(el, rule) : 0 }
      })
      .filter((c) => c.rule)
      .sort((a, b) => b.score - a.score)

    for (const { el, rule } of candidates) {
      if (filledEls.has(el)) continue
      if (applyFieldValue(el, rule.value)) {
        filled++
        filledEls.add(el)
      }
    }
  }

  // Consent / agreement checkboxes
  for (const doc of getAllDocuments()) {
    for (const el of doc.querySelectorAll('input[type="checkbox"]')) {
      if (!isFillable(el) || el.checked) continue
      const hay = getFieldHaystack(el)
      if (/agree|consent|accept|terms|privacy|acknowledge|confirm/i.test(hay)) {
        if (setCheckbox(el, true)) filled++
      }
    }
  }

  // Radio groups for yes/no authorization
  const radioGroups = new Set()
  for (const doc of getAllDocuments()) {
    for (const el of doc.querySelectorAll('input[type="radio"]')) {
      if (!el.name || radioGroups.has(el.name)) continue
      radioGroups.add(el.name)
      const hay = getFieldHaystack(el)
      if (/sponsor|visa/i.test(hay) && profile.requiresSponsorship) {
        if (setRadioByValue(el.name, profile.requiresSponsorship, doc)) filled++
      } else if (/authoriz|eligible|legally/i.test(hay) && profile.workAuthorization) {
        if (setRadioByValue(el.name, profile.workAuthorization, doc)) filled++
      } else if (/relocate/i.test(hay) && profile.willingToRelocate) {
        if (setRadioByValue(el.name, profile.willingToRelocate, doc)) filled++
      } else if (/gender|sex/i.test(hay) && profile.gender) {
        if (setRadioByValue(el.name, profile.gender, doc)) filled++
      }
    }
  }

  // Remaining empty long textareas — cover letter / additional info
  const fallbackLong = profile.bio || profile.workExperienceText || profile.resumeText?.slice(0, 3000)
  for (const doc of getAllDocuments()) {
    for (const ta of doc.querySelectorAll('textarea')) {
      if (!isFillable(ta) || hasValue(ta)) continue
      const hay = getFieldHaystack(ta)
      if (/additional|anything else|other|comments|message|describe|tell us/i.test(hay) && fallbackLong) {
        if (applyFieldValue(ta, fallbackLong)) filled++
      }
    }
  }

  return filled
}

function buildFallbackRules(profile) {
  const skills = profile.skills?.join(', ') || ''
  const rules = [
    { keywords: ['first name', 'firstname', 'fname', 'given'], value: profile.firstName, exclude: ['last', 'company'], priority: 100 },
    { keywords: ['last name', 'lastname', 'lname', 'surname'], value: profile.lastName, exclude: ['first'], priority: 100 },
    { keywords: ['full name', 'legal name'], value: profile.fullName, exclude: ['company'], priority: 90 },
    { keywords: ['email'], value: profile.email, priority: 100 },
    { keywords: ['phone', 'mobile', 'tel'], value: profile.phone, priority: 95 },
    { keywords: ['gender', 'sex'], value: profile.gender, priority: 90 },
    { keywords: ['city'], value: profile.city, priority: 80 },
    { keywords: ['state', 'province'], value: profile.state, priority: 80 },
    { keywords: ['country'], value: profile.country, priority: 80 },
    { keywords: ['pincode', 'postal', 'zip'], value: profile.pincode, priority: 80 },
    { keywords: ['linkedin'], value: profile.linkedinUrl, priority: 85 },
    { keywords: ['github'], value: profile.githubUrl, priority: 85 },
    { keywords: ['portfolio', 'website'], value: profile.portfolioUrl, priority: 80 },
    { keywords: ['college', 'university', 'school'], value: profile.college, priority: 85 },
    { keywords: ['degree', 'qualification'], value: profile.degree, priority: 85 },
    { keywords: ['graduation', 'grad year'], value: profile.graduationYear ? String(profile.graduationYear) : '', priority: 85 },
    { keywords: ['skills'], value: skills, priority: 80 },
    { keywords: ['cover letter', 'summary', 'about you'], value: profile.bio, priority: 70 },
    { keywords: ['experience', 'employment'], value: profile.workExperienceText, priority: 75 },
    { keywords: ['education'], value: profile.educationText || profile.educationSummary, priority: 75 },
    { keywords: ['years of experience', 'yoe'], value: profile.yearsOfExperience, priority: 85 },
    { keywords: ['notice', 'availability'], value: profile.noticePeriod, priority: 80 },
    { keywords: ['authorization', 'authorised', 'authorized'], value: profile.workAuthorization, priority: 90 },
    { keywords: ['sponsorship', 'visa'], value: profile.requiresSponsorship, priority: 90 },
  ]
  return rules.filter((r) => r.value)
}

function comprehensiveFill(profile) {
  const ats = detectAts()
  let filled = atsSpecificFill(profile, ats)
  filled += fillFromRules(profile)
  return filled
}

// ─── Resume attachment ───────────────────────────────────────────────────────

async function downloadAndAttachResume(profile, baseUrl, token) {
  if (!profile.tailoredResumeDownloadUrl) return 0
  try {
    const url = profile.tailoredResumeDownloadUrl.startsWith('http')
      ? profile.tailoredResumeDownloadUrl
      : `${baseUrl}${profile.tailoredResumeDownloadUrl}`
    const res = await fetch(url, { headers: { 'X-CareerOS-Token': token } })
    if (!res.ok) return 0
    const blob = await res.blob()
    const file = new File([blob], profile.tailoredResumeFilename || 'resume.docx', {
      type: blob.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    let attached = 0
    for (const doc of getAllDocuments()) {
      const inputs = [...doc.querySelectorAll('input[type="file"]')].filter(isFillable)
      for (const fileInput of inputs) {
        const hay = getFieldHaystack(fileInput)
        if (fileInput.files?.length) continue
        if (!/resume|cv|curriculum|document/i.test(hay) && inputs.length > 1) continue
        const dt = new DataTransfer()
        dt.items.add(file)
        fileInput.files = dt.files
        fileInput.dispatchEvent(new Event('change', { bubbles: true }))
        fileInput.dispatchEvent(new Event('input', { bubbles: true }))
        attached++
      }
    }
    return attached
  } catch {
    return 0
  }
}

// ─── Storage & job context ───────────────────────────────────────────────────

function getStorage(keys) {
  return new Promise((resolve) => {
    const finish = (local, sync) => resolve({ ...sync, ...local })
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      finish({}, {})
      return
    }
    chrome.storage.local.get(keys, (local) => {
      if (chrome.storage?.sync) {
        chrome.storage.sync.get(keys, (sync) => finish(local, sync))
      } else {
        finish(local, {})
      }
    })
  })
}

function getJobIdFromContext() {
  return getStorage(['activeTabJobId', 'pendingJobId', 'pendingApplyUrl']).then((data) => {
    if (data.activeTabJobId) return data.activeTabJobId
    if (data.pendingJobId && data.pendingApplyUrl) {
      if (normalizeApplyUrl(data.pendingApplyUrl) === normalizeApplyUrl(location.href)) {
        return data.pendingJobId
      }
    }
    return null
  })
}

async function resolveAndStoreTabJob() {
  if (!isAtsUrl(location.href)) return null
  const { baseUrl, token } = await getStorage(['baseUrl', 'token'])
  if (!token) return null
  const page = scrapePageJobMeta()
  const resolved = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'RESOLVE_JOB',
        baseUrl: baseUrl || 'http://localhost:3000',
        token,
        url: page.applyUrl,
        pageTitle: page.title,
        pageCompany: page.company,
      },
      (res) => (res?.ok ? resolve(res) : reject(new Error(res?.error || 'resolve failed')))
    )
  })
  await new Promise((resolve) => {
    chrome.storage.local.set(
      {
        activeTabApplyUrl: page.normalizedUrl,
        activeTabJobId: resolved.jobId || null,
        activeTabTitle: resolved.job?.title || page.title || resolved.pageOnly?.title || null,
        activeTabCompany: resolved.job?.company || page.company || resolved.pageOnly?.company || null,
      },
      resolve
    )
  })
  return resolved
}

async function runAutofill() {
  const { baseUrl, token } = await getStorage(['baseUrl', 'token'])
  if (!token) {
    return { ok: false, message: 'Connect your CareerOS account in the extension popup (one-time sign-in).' }
  }

  if (isAtsUrl(location.href)) {
    await resolveAndStoreTabJob()
  }

  const jobId = await getJobIdFromContext()
  const profile = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_PROFILE', baseUrl: baseUrl || 'http://localhost:3000', token, jobId },
      (res) => (res?.ok ? resolve(res.profile) : reject(new Error(res?.error || 'Profile fetch failed')))
    )
  })

  const filled = comprehensiveFill(profile)
  const resumesAttached = await downloadAndAttachResume(profile, baseUrl || 'http://localhost:3000', token)

  const parts = [`${filled} field${filled === 1 ? '' : 's'}`]
  if (resumesAttached) parts.push(`${resumesAttached} resume${resumesAttached === 1 ? '' : 's'}`)

  showBanner(`CareerOS filled ${parts.join(' + ')}. Review every answer before submitting.`)
  return { ok: true, message: `Filled ${filled} fields.`, filled, resumesAttached }
}

function showBanner(text) {
  const id = 'careeros-autofill-banner'
  document.getElementById(id)?.remove()
  const el = document.createElement('div')
  el.id = id
  el.textContent = text
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2147483647',
    background: '#6be82c',
    color: '#111',
    padding: '12px 16px',
    borderRadius: '10px',
    fontFamily: 'system-ui,sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 20px rgba(0,0,0,.15)',
    maxWidth: '380px',
    lineHeight: '1.4',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 10000)
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAREEROS_AUTOFILL') {
    runAutofill()
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, message: String(err) }))
    return true
  }
  if (msg.type === 'GET_PAGE_JOB_CONTEXT') {
    const page = scrapePageJobMeta()
    if (page.isAtsPage && msg.resolve) {
      resolveAndStoreTabJob()
        .then((resolved) => sendResponse({ ok: true, page, resolved }))
        .catch((err) => sendResponse({ ok: true, page, resolved: null, error: String(err) }))
      return true
    }
    sendResponse({ ok: true, page })
    return true
  }
})

function injectFab() {
  if (document.getElementById('careeros-fab')) return
  const btn = document.createElement('button')
  btn.id = 'careeros-fab'
  btn.textContent = 'Autofill'
  btn.title = 'Fill all application fields from your CareerOS profile'
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    zIndex: '2147483646',
    background: '#6be82c',
    color: '#111',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '999px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'system-ui,sans-serif',
    boxShadow: '0 2px 12px rgba(0,0,0,.12)',
  })
  btn.addEventListener('click', () => runAutofill().catch(console.error))
  document.body.appendChild(btn)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectFab()
    resolveAndStoreTabJob().catch(() => {})
  })
} else {
  injectFab()
  resolveAndStoreTabJob().catch(() => {})
}

let lastSyncedUrl = location.href
setInterval(() => {
  if (location.href !== lastSyncedUrl) {
    lastSyncedUrl = location.href
    resolveAndStoreTabJob().catch(() => {})
  }
}, 1500)
