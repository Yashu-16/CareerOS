chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_PROFILE') {
    fetchProfile(msg.baseUrl, msg.token, msg.jobId)
      .then((profile) => sendResponse({ ok: true, profile }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true
  }
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
