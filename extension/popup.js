const baseUrlEl = document.getElementById('baseUrl')
const tokenEl = document.getElementById('token')
const statusEl = document.getElementById('status')

chrome.storage.sync.get(['baseUrl', 'token'], (data) => {
  baseUrlEl.value = data.baseUrl || 'http://localhost:3000'
  tokenEl.value = data.token || ''
})

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set(
    {
      baseUrl: baseUrlEl.value.replace(/\/$/, ''),
      token: tokenEl.value.trim(),
    },
    () => {
      statusEl.textContent = 'Settings saved.'
      statusEl.className = 'status ok'
    }
  )
})

document.getElementById('autofill').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  chrome.tabs.sendMessage(tab.id, { type: 'CAREEROS_AUTOFILL' }, (res) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = 'Open a supported job application page first.'
      statusEl.className = 'status err'
      return
    }
    statusEl.textContent = res?.message || 'Autofill triggered.'
    statusEl.className = res?.ok ? 'status ok' : 'status err'
  })
})
