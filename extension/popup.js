const DEFAULT_BASE_URL = 'http://localhost:3000'

const els = {
  connectView: document.getElementById('connectView'),
  mainView: document.getElementById('mainView'),
  connectBtn: document.getElementById('connectBtn'),
  connectMsg: document.getElementById('connectMsg'),
  connectionBar: document.getElementById('connectionBar'),
  connectionText: document.getElementById('connectionText'),
  jobHint: document.getElementById('jobHint'),
  matchRow: document.getElementById('matchRow'),
  jobLabel: document.getElementById('jobLabel'),
  matchScore: document.getElementById('matchScore'),
  openJobBtn: document.getElementById('openJobBtn'),
  autofill: document.getElementById('autofill'),
  status: document.getElementById('status'),
  infoBody: document.getElementById('infoBody'),
  resumeFile: document.getElementById('resumeFile'),
  tailorLink: document.getElementById('tailorLink'),
  settingsPanel: document.getElementById('settingsPanel'),
  toggleSettings: document.getElementById('toggleSettings'),
  baseUrl: document.getElementById('baseUrl'),
  saveSettings: document.getElementById('saveSettings'),
  disconnect: document.getElementById('disconnect'),
}

let state = {
  baseUrl: DEFAULT_BASE_URL,
  token: null,
  userEmail: null,
  pendingJobId: null,
  profile: null,
  tabContext: null,
}

function isAtsUrl(url) {
  return /greenhouse\.io|lever\.co|ashbyhq\.com|workday|smartrecruiters/i.test(url || '')
}

function getStorage() {
  return new Promise((resolve) => {
    const finish = (local, sync) => {
      resolve({
        baseUrl: local.baseUrl || sync.baseUrl || DEFAULT_BASE_URL,
        token: local.token || sync.token || null,
        userEmail: local.userEmail || null,
        userName: local.userName || null,
        pendingJobId: local.pendingJobId || sync.pendingJobId || null,
      })
    }

    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      finish({}, {})
      return
    }

    chrome.storage.local.get(
      ['baseUrl', 'token', 'userEmail', 'userName', 'connectedAt', 'pendingJobId'],
      (local) => {
        if (chrome.storage?.sync) {
          chrome.storage.sync.get(['baseUrl', 'token', 'pendingJobId'], (sync) => finish(local, sync))
        } else {
          finish(local, {})
        }
      }
    )
  })
}

function migrateLegacyToken(data) {
  if (!data.token) return Promise.resolve()
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        baseUrl: data.baseUrl,
        token: data.token,
        userEmail: data.userEmail,
        pendingJobId: data.pendingJobId,
      },
      () => {
        if (chrome.storage?.sync) {
          chrome.storage.sync.remove(['token', 'baseUrl'], resolve)
        } else {
          resolve()
        }
      }
    )
  })
}

function showView(connected) {
  els.connectView.classList.toggle('hidden', connected)
  els.mainView.classList.toggle('hidden', !connected)
}

function setMsg(el, text, ok) {
  el.textContent = text || ''
  el.className = 'msg' + (text ? (ok ? ' ok' : ' err') : '')
}

async function resolveJobForActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url) {
    const data = await getStorage()
    return { jobId: data.pendingJobId || null, resolved: null, page: null, source: 'pending' }
  }

  if (tab.id && isAtsUrl(tab.url)) {
    const fromContent = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_JOB_CONTEXT', resolve: true }, (res) => {
        if (chrome.runtime.lastError) resolve(null)
        else resolve(res)
      })
    })

    if (fromContent?.resolved) {
      return {
        jobId: fromContent.resolved.jobId || null,
        resolved: fromContent.resolved,
        page: fromContent.page,
        source: 'tab',
      }
    }
  }

  if (isAtsUrl(tab.url)) {
    const resolved = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'RESOLVE_JOB',
          baseUrl: state.baseUrl,
          token: state.token,
          url: tab.url.split('#')[0].split('?')[0],
          tabTitle: tab.title,
        },
        (res) => (res?.ok ? resolve(res) : reject(new Error(res?.error || 'Could not resolve job')))
      )
    })
    return {
      jobId: resolved.jobId || null,
      resolved,
      page: { applyUrl: tab.url, isAtsPage: true },
      source: 'tab',
    }
  }

  const data = await getStorage()
  return { jobId: data.pendingJobId || null, resolved: null, page: null, source: 'pending' }
}

async function fetchProfilePreview() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'FETCH_PROFILE',
        baseUrl: state.baseUrl,
        token: state.token,
        jobId: state.pendingJobId,
      },
      (res) => (res?.ok ? resolve(res.profile) : reject(new Error(res?.error || 'Failed to load profile')))
    )
  })
}

function renderProfile(profile, tabContext) {
  state.profile = profile

  const name = profile.fullName || profile.email
  els.connectionText.textContent = `Connected as ${name}`

  const resolved = tabContext?.resolved
  const page = tabContext?.page
  const pageTitle =
    profile.jobTitle ||
    resolved?.job?.title ||
    page?.title ||
    resolved?.pageOnly?.title ||
    null
  const pageCompany =
    profile.company ||
    resolved?.job?.company ||
    page?.company ||
    resolved?.pageOnly?.company ||
    null
  const effectiveJobId = profile.jobId || tabContext?.jobId || null
  const onAtsTab = tabContext?.source === 'tab'
  const hasTailored =
    !!profile.tailoredResumeId || !!resolved?.job?.tailoredResumeId

  if (pageTitle && (effectiveJobId || onAtsTab)) {
    els.jobHint.innerHTML = `<strong>${pageTitle}</strong>${pageCompany ? ` at ${pageCompany}` : ''}`
    els.matchRow.classList.remove('hidden')
    els.jobLabel.textContent = pageTitle
    if (effectiveJobId) {
      els.matchScore.textContent = hasTailored ? 'Tailored resume ready' : 'Tailor resume in CareerOS first'
      els.openJobBtn.classList.remove('hidden')
      els.openJobBtn.onclick = () => {
        chrome.tabs.create({ url: `${state.baseUrl}/jobs/${effectiveJobId}` })
      }
      els.tailorLink.href = `${state.baseUrl}/jobs/${effectiveJobId}`
      els.tailorLink.classList.remove('hidden')
    } else {
      els.matchScore.textContent = 'Add this job in CareerOS to tailor your resume'
      els.openJobBtn.classList.add('hidden')
      const q = encodeURIComponent(pageTitle)
      els.tailorLink.href = `${state.baseUrl}/jobs?q=${q}`
      els.tailorLink.classList.remove('hidden')
    }
  } else {
    els.jobHint.textContent =
      'Open a job application page or use Apply with autofill from CareerOS to link your tailored resume.'
    els.matchRow.classList.add('hidden')
    els.openJobBtn.classList.add('hidden')
    els.tailorLink.classList.add('hidden')
  }

  const resumeName =
    profile.tailoredResumeFilename ||
    resolved?.job?.tailoredResumeFilename ||
    null

  if (resumeName) {
    els.resumeFile.textContent = resumeName
  } else if (effectiveJobId) {
    els.resumeFile.textContent = 'No tailored resume yet — tailor in CareerOS first'
  } else if (onAtsTab && pageTitle) {
    els.resumeFile.textContent = `No tailored resume for ${pageTitle}`
  } else {
    els.resumeFile.textContent = 'Upload a DOCX on CareerOS, then tailor for a job'
  }

  const lines = [
    profile.fullName && `Name: ${profile.fullName}`,
    profile.email && `Email: ${profile.email}`,
    profile.phone && `Phone: ${profile.phone}`,
    profile.city && `City: ${profile.city}`,
    profile.linkedinUrl && `LinkedIn: ${profile.linkedinUrl}`,
    profile.skills?.length && `Skills: ${profile.skills.slice(0, 8).join(', ')}`,
  ].filter(Boolean)

  els.infoBody.innerHTML = lines.length
    ? lines.map((l) => `<div>${l}</div>`).join('')
    : '<div>Complete your profile on CareerOS to improve autofill.</div>'
}

async function init() {
  const data = await getStorage()
  await migrateLegacyToken(data)

  state.baseUrl = (data.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')
  state.token = data.token
  state.userEmail = data.userEmail
  state.pendingJobId = data.pendingJobId
  els.baseUrl.value = state.baseUrl

  if (!state.token) {
    showView(false)
    return
  }

  showView(true)
  try {
    state.tabContext = await resolveJobForActiveTab()
    state.pendingJobId = state.tabContext.jobId
    const profile = await fetchProfilePreview()
    renderProfile(profile, state.tabContext)
    setMsg(els.status, '', true)
  } catch {
    els.connectionBar.classList.add('warn')
    els.connectionBar.querySelector('.status-dot').classList.add('warn')
    els.connectionText.textContent = 'Session expired — connect again'
    showView(false)
    chrome.storage.local.remove(['token', 'userEmail', 'userName', 'connectedAt'])
    state.token = null
  }
}

els.connectBtn.addEventListener('click', () => {
  const url = `${state.baseUrl}/extension/connect?extensionId=${chrome.runtime.id}`
  chrome.tabs.create({ url })
  setMsg(els.connectMsg, 'Complete sign-in in the new tab — this popup will connect automatically.', true)
})

els.autofill.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  setMsg(els.status, 'Autofilling…', true)
  chrome.tabs.sendMessage(tab.id, { type: 'CAREEROS_AUTOFILL' }, (res) => {
    if (chrome.runtime.lastError) {
      setMsg(els.status, 'Open a job application page (Greenhouse, Lever, etc.) first.', false)
      return
    }
    setMsg(els.status, res?.message || 'Done.', !!res?.ok)
  })
})

els.toggleSettings.addEventListener('click', () => {
  els.settingsPanel.classList.toggle('open')
})

els.saveSettings.addEventListener('click', () => {
  state.baseUrl = els.baseUrl.value.replace(/\/$/, '') || DEFAULT_BASE_URL
  chrome.storage.local.set({ baseUrl: state.baseUrl }, () => {
    setMsg(els.status, 'URL saved.', true)
  })
})

els.disconnect.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'DISCONNECT' }, () => {
    state.token = null
    showView(false)
    els.settingsPanel.classList.remove('open')
    setMsg(els.connectMsg, 'Disconnected. Connect again anytime.', true)
  })
})

document.querySelectorAll('[data-toggle]').forEach((head) => {
  head.addEventListener('click', () => {
    head.closest('.section')?.classList.toggle('open')
  })
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  if (changes.token?.newValue) {
    init()
  }
})

init()
