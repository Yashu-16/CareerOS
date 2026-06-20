/** Runs on CareerOS web app — stores pending apply job id for the extension. */
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (event.data?.type !== 'CAREEROS_SET_APPLY_CONTEXT') return
  chrome.storage.sync.set({
    pendingJobId: event.data.jobId || null,
    pendingApplyUrl: event.data.applyUrl || null,
  })
})
