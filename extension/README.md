# CareerOS Autofill Extension

Jobright-style browser extension that fills job application forms using your CareerOS profile and **job-specific tailored resume**.

## Setup

1. Open Chrome → **Extensions** → **Manage extensions** → **Load unpacked**
2. Select this `extension/` folder
3. In CareerOS, open a job → **Smart Apply** → **Get extension token** (copies token)
4. Click the extension icon → paste token → Save settings
5. On a job application page (Greenhouse, Lever, Ashby, Workday, etc.), click **Autofill**

## Flow (matches Jobright)

1. **Tailor resume** in CareerOS for the target job (keywords added, DOCX layout preserved)
2. **Apply with autofill** opens the company's apply URL and stores job context
3. **Extension** fetches your profile + tailored resume download URL
4. **Autofill** fills name, email, phone, links, skills, cover letter fields
5. **Resume upload** attaches the tailored DOCX when a file input is present

## Supported platforms

- Greenhouse (`boards.greenhouse.io`)
- Lever (`jobs.lever.co`)
- Ashby (`jobs.ashbyhq.com`)
- Workday, SmartRecruiters (generic field matching)
- Fallback keyword matching on other career pages

## API endpoints used

- `GET /api/apply/autofill-profile?jobId=…` — profile payload (header: `X-CareerOS-Token`)
- `GET /api/apply/tailored/:id/download` — tailored resume file

## Development

Set **CareerOS URL** to `http://localhost:3000` when running locally.

Note: Chrome extensions cannot load from the store until published; use **Load unpacked** for now.
