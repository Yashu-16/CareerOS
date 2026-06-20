# CareerOS Autofill Extension

Jobright-style browser extension that fills job application forms using your CareerOS profile and **job-specific tailored resume**.

## Setup (one time)

1. Open Chrome → **Extensions** → **Manage extensions** → **Load unpacked**
2. Select this `extension/` folder
3. Click the CareerOS extension icon → **Connect to CareerOS**
4. Sign in on the page that opens — connection is saved automatically (90 days)

No tokens to copy or paste.

## Flow (like Jobright)

1. **Tailor resume** in CareerOS for the target job (keywords added, DOCX layout preserved)
2. **Apply with autofill** opens the company's apply URL and links job context to the extension
3. On any ATS tab, the extension **matches the current page URL** to the correct CareerOS job (not a previous job)
4. On the application page, click **Autofill** in the extension popup (or the floating button)
5. Extension fills fields and attaches the tailored DOCX for **this posting**

## Supported platforms

- Greenhouse (`boards.greenhouse.io`, `job-boards.greenhouse.io`)
- Lever (`jobs.lever.co`)
- Ashby (`jobs.ashbyhq.com`)
- Workday, SmartRecruiters (generic field matching)
- Fallback keyword matching on other career pages

## API endpoints used

- `GET /api/apply/autofill-profile?jobId=…` — profile payload (header: `X-CareerOS-Token`, stored locally after connect)
- `GET /api/apply/tailored/:id/download` — tailored resume file

## Development

Default CareerOS URL is `http://localhost:3000`. Change it in extension **Settings** (gear icon) if needed.

Reload the extension after code changes: **Extensions** → refresh icon on CareerOS Autofill.

Note: Chrome extensions cannot load from the store until published; use **Load unpacked** for now.
