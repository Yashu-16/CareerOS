/** Runs on CareerOS web app — syncs apply context and extension presence. */

function hasExtensionStorage() {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local
}

function persistApplyContext(data) {
  const payload = {
    pendingJobId: data.jobId || null,
    pendingApplyUrl: data.applyUrl || null,
    pendingJobTitle: data.jobTitle || null,
    pendingCompany: data.company || null,
  }

  try {
    localStorage.setItem('careeros_apply_context', JSON.stringify(payload))
  } catch {
    /* ignore quota / privacy mode */
  }

  if (!hasExtensionStorage()) return Promise.resolve()

  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(payload, () => resolve())
    } catch {
      resolve()
    }
  })
}

function readStoredApplyContext() {
  try {
    const raw = localStorage.getItem('careeros_apply_context')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (event.data?.type !== 'CAREEROS_SET_APPLY_CONTEXT') return
  persistApplyContext(event.data).catch(() => {})
})

/** Let CareerOS pages know the extension is installed (for one-click connect). */
function announceExtension() {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) return
  window.postMessage(
    {
      type: 'CAREEROS_EXTENSION_PRESENT',
      extensionId: chrome.runtime.id,
    },
    '*'
  )
}

announceExtension()
document.addEventListener('DOMContentLoaded', () => {
  announceExtension()
  const ctx = readStoredApplyContext()
  if (ctx?.pendingJobId && hasExtensionStorage()) {
    chrome.storage.local.set(ctx, () => {})
  }
})

/** Auto-connect when user completes Smart Apply connect flow on the same tab. */
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (event.data?.type !== 'CAREEROS_EXTENSION_CONNECT') return
  const { token, baseUrl, userEmail, userName } = event.data
  if (!token || !hasExtensionStorage()) return

  try {
    chrome.storage.local.set({
      token,
      baseUrl: (baseUrl || location.origin).replace(/\/$/, ''),
      userEmail: userEmail || null,
      userName: userName || null,
      connectedAt: Date.now(),
    })
  } catch {
    /* ignore */
  }
})
