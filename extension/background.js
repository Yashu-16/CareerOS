const DEFAULT_BASE_URL = 'http://localhost:3000'

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['baseUrl', 'token'], (data) => {
    if (!data.baseUrl) {
      chrome.storage.local.set({ baseUrl: DEFAULT_BASE_URL })
    }
  })
})

function saveConnection({ token, baseUrl, userEmail, userName }) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        token,
        baseUrl: (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, ''),
        userEmail: userEmail || null,
        userName: userName || null,
        connectedAt: Date.now(),
      },
      resolve
    )
  })
}

function handleConnect(msg, sendResponse) {
  saveConnection(msg)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }))
  return true
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAREEROS_CONNECT') return handleConnect(msg, sendResponse)
  if (msg.type === 'FETCH_PROFILE') {
    fetchProfile(msg.baseUrl, msg.token, msg.jobId)
      .then((profile) => sendResponse({ ok: true, profile }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true
  }
  if (msg.type === 'VERIFY_CONNECTION') {
    verifyConnection(msg.baseUrl, msg.token)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true
  }
  if (msg.type === 'DISCONNECT') {
    chrome.storage.local.remove(['token', 'userEmail', 'userName', 'connectedAt'], () => {
      sendResponse({ ok: true })
    })
    return true
  }
  if (msg.type === 'RESOLVE_JOB') {
    resolveJob(msg.baseUrl, msg.token, msg.url, msg.tabTitle, msg.pageTitle, msg.pageCompany)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true
  }
})

chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAREEROS_CONNECT') return handleConnect(msg, sendResponse)
})

async function fetchProfile(baseUrl, token, jobId) {
  const url = new URL(`${baseUrl}/api/apply/autofill-profile`)
  if (jobId) url.searchParams.set('jobId', jobId)
  const res = await fetch(url.toString(), {
    headers: { 'X-CareerOS-Token': token },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

async function verifyConnection(baseUrl, token) {
  const profile = await fetchProfile(baseUrl, token, null)
  return {
    valid: true,
    userEmail: profile.email,
    userName: profile.fullName,
  }
}

async function resolveJob(baseUrl, token, url, tabTitle, pageTitle, pageCompany) {
  const apiUrl = new URL(`${baseUrl}/api/apply/resolve-job`)
  apiUrl.searchParams.set('url', url)
  if (tabTitle) apiUrl.searchParams.set('tabTitle', tabTitle)
  if (pageTitle) apiUrl.searchParams.set('pageTitle', pageTitle)
  if (pageCompany) apiUrl.searchParams.set('pageCompany', pageCompany)

  const res = await fetch(apiUrl.toString(), {
    headers: { 'X-CareerOS-Token': token },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
