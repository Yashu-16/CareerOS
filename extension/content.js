/**
 * CareerOS Autofill — content script for ATS application pages.
 * Detects common form fields and fills from the user's CareerOS profile.
 */

function setNativeValue(el, value) {
  if (!el || value == null || value === '') return false
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

function findField(keywords) {
  const inputs = [...document.querySelectorAll('input, textarea, select')]
  for (const el of inputs) {
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') continue
    const hay = `${el.name} ${el.id} ${el.placeholder} ${el.getAttribute('aria-label') || ''} ${el.labels?.[0]?.textContent || ''}`.toLowerCase()
    if (keywords.some((k) => hay.includes(k))) return el
  }
  return null
}

function fillByKeywords(map) {
  let filled = 0
  for (const [keys, value] of map) {
    if (!value) continue
    const el = findField(keys)
    if (el && setNativeValue(el, value)) filled++
  }
  return filled
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

function greenhouseFill(p) {
  const ids = {
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    phone: p.phone,
    job_application_answers_attributes_0_text_value: p.bio,
  }
  let n = 0
  for (const [id, val] of Object.entries(ids)) {
    const el = document.getElementById(id)
    if (el && setNativeValue(el, val)) n++
  }
  n += fillByKeywords([
    [['linkedin', 'linked in'], p.linkedinUrl],
    [['github'], p.githubUrl],
    [['portfolio', 'website'], p.portfolioUrl],
    [['cover letter'], p.bio],
  ])
  return n
}

function genericFill(p) {
  return fillByKeywords([
    [['first name', 'firstname', 'fname', 'given'], p.firstName],
    [['last name', 'lastname', 'lname', 'surname', 'family'], p.lastName],
    [['full name', 'name'], p.fullName],
    [['email', 'e-mail'], p.email],
    [['phone', 'mobile', 'tel'], p.phone],
    [['city', 'location'], p.city],
    [['linkedin'], p.linkedinUrl],
    [['github'], p.githubUrl],
    [['portfolio', 'website', 'personal site'], p.portfolioUrl],
    [['skills'], p.skills?.join(', ')],
    [['cover letter', 'summary', 'about you'], p.bio],
  ])
}

async function downloadAndAttachResume(profile, baseUrl, token) {
  if (!profile.tailoredResumeDownloadUrl) return false
  try {
    const url = profile.tailoredResumeDownloadUrl.startsWith('http')
      ? profile.tailoredResumeDownloadUrl
      : `${baseUrl}${profile.tailoredResumeDownloadUrl}`
    const res = await fetch(url, { headers: { 'X-CareerOS-Token': token } })
    if (!res.ok) return false
    const blob = await res.blob()
    const file = new File([blob], profile.tailoredResumeFilename || 'resume.docx', {
      type: blob.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const fileInput = document.querySelector('input[type="file"]')
    if (!fileInput) return false
    const dt = new DataTransfer()
    dt.items.add(file)
    fileInput.files = dt.files
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  } catch {
    return false
  }
}

function getJobIdFromContext() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['pendingJobId'], (data) => resolve(data.pendingJobId || null))
  })
}

async function runAutofill() {
  const { baseUrl, token } = await chrome.storage.sync.get(['baseUrl', 'token'])
  if (!token) return { ok: false, message: 'Connect your extension token in the popup.' }

  const jobId = await getJobIdFromContext()
  const profile = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_PROFILE', baseUrl: baseUrl || 'http://localhost:3000', token, jobId },
      (res) => (res?.ok ? resolve(res.profile) : reject(new Error(res?.error || 'Profile fetch failed')))
    )
  })

  const ats = detectAts()
  let filled = ats === 'greenhouse' ? greenhouseFill(profile) : genericFill(profile)
  const resumeAttached = await downloadAndAttachResume(profile, baseUrl || 'http://localhost:3000', token)

  showBanner(
    `CareerOS filled ${filled} field${filled === 1 ? '' : 's'}${resumeAttached ? ' + resume attached' : ''}. Review before submitting.`
  )
  return { ok: true, message: `Filled ${filled} fields.` }
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
    maxWidth: '360px',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 8000)
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAREEROS_AUTOFILL') {
    runAutofill()
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, message: String(err) }))
    return true
  }
})

// Floating button on application pages
function injectFab() {
  if (document.getElementById('careeros-fab')) return
  const btn = document.createElement('button')
  btn.id = 'careeros-fab'
  btn.textContent = 'Autofill'
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    zIndex: '2147483646',
    background: '#111',
    color: '#6be82c',
    border: '2px solid #6be82c',
    padding: '10px 16px',
    borderRadius: '999px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'system-ui,sans-serif',
  })
  btn.addEventListener('click', () => runAutofill().catch(console.error))
  document.body.appendChild(btn)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFab)
} else {
  injectFab()
}
