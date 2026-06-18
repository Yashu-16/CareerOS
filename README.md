# CareerOS India 🇮🇳

**An AI-powered career intelligence platform for Indian students and early-career professionals.**

CareerOS aggregates real Indian job listings, scores resumes against ATS systems with AI, semantically matches users to relevant jobs, and provides an AI career coach — all tailored for the Indian job market. Think Handshake + Jobright, rebuilt for India.

> Production-grade, not a prototype. Every feature works with **real, live data** from real APIs.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| **Real job aggregation** | Live Indian jobs from LinkedIn, Indeed, Glassdoor & Naukri via the JSearch API. |
| **ATS resume scoring** | Anthropic Claude scores your resume (0–100) with sub-scores, matched/missing keywords, and AI rewrite suggestions. |
| **Semantic job matching** | OpenAI embeddings + Pinecone vector search rank jobs by true fit to your resume. |
| **AI Career Copilot** | Streaming (SSE) Claude-powered advisor specialised in the Indian hiring landscape. |
| **Application tracker** | Drag-and-drop Kanban board (Applied → Screening → Interview → Offer → Rejected). |
| **Hiring drives** | Companies actively hiring right now, derived from real synced job data. |
| **Auth** | Email/password (with verification) + Google OAuth via NextAuth. |
| **Direct-to-S3 uploads** | Resumes upload straight to S3 via presigned URLs; files are never public. |

---

## 🧱 Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Forms/Validation:** React Hook Form + Zod
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Cache / Rate-limit / OTP:** Upstash Redis
- **Auth:** NextAuth v4 (Google + Credentials)
- **AI:** Anthropic Claude (`claude-sonnet-4-6` primary, `claude-haiku-4-5` fallback)
- **Embeddings:** OpenAI `text-embedding-ada-002`
- **Vector DB:** Pinecone
- **File storage:** AWS S3 (presigned URLs, `ap-south-1` Mumbai)
- **Email:** SendGrid (Dynamic Templates, with HTML fallbacks)
- **Push:** Firebase Cloud Messaging (admin SDK)
- **Jobs data:** JSearch API (RapidAPI)
- **Deploy:** Vercel (with Cron)

---

## 📋 Prerequisites

- **Node.js 18.18+** (tested on Node 24)
- **npm 9+**
- A **PostgreSQL** database (Supabase or Railway recommended)
- Accounts/keys for the services listed in [Environment Variables](#-environment-variables). The app **degrades gracefully** when optional services aren't configured, but core flows need at least a database, `NEXTAUTH_SECRET`, and the relevant API keys.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall)
npm install

# 2. Create your environment file and fill in the values
cp .env.example .env.local
#   (on Windows PowerShell: Copy-Item .env.example .env.local)

# 3. Push the database schema to PostgreSQL
npm run prisma:push

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000**.

---

## 🔑 Environment Variables

Copy `.env.example` → `.env.local` and fill in real values.

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/careeros?schema=public

# Auth
NEXTAUTH_SECRET=         # generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Vector DB
PINECONE_API_KEY=
PINECONE_INDEX_HOST=     # from Pinecone dashboard (index name: careeros-jobs-india)

# AWS S3 (Mumbai)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=careeros-resumes-india

# Email (SendGrid) — template IDs optional; HTML fallbacks are built in
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@careeros.in
SENDGRID_VERIFICATION_TEMPLATE_ID=
SENDGRID_OTP_TEMPLATE_ID=
SENDGRID_WELCOME_TEMPLATE_ID=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Jobs API (RapidAPI JSearch)
JSEARCH_API_KEY=
JSEARCH_API_HOST=jsearch.p.rapidapi.com

# Firebase (FCM)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Cron protection
CRON_SECRET=             # any random string

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","projectId":"..."}
```

### Where to get each key
- **DATABASE_URL** — Supabase → Project Settings → Database, or Railway → PostgreSQL plugin.
- **NEXTAUTH_SECRET** — run `openssl rand -base64 32`.
- **GOOGLE_CLIENT_ID/SECRET** — Google Cloud Console → OAuth credentials. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
- **ANTHROPIC_API_KEY** — console.anthropic.com.
- **OPENAI_API_KEY** — platform.openai.com.
- **PINECONE** — create an index named `careeros-jobs-india` (dimension **1536**, cosine) and copy its host.
- **AWS S3** — create a private bucket in `ap-south-1`; the IAM user needs `PutObject`/`GetObject`. Configure CORS to allow `PUT` from your app origin.
- **SENDGRID_API_KEY** — SendGrid → API Keys (verify a sender for `SENDGRID_FROM_EMAIL`).
- **UPSTASH** — Upstash console → create a Redis database (REST URL + token).
- **JSEARCH_API_KEY** — RapidAPI → subscribe to **JSearch**.

---

## 🗄️ Database

```bash
npm run prisma:generate   # regenerate the Prisma client
npm run prisma:push       # push schema to the DB (no migration history)
npm run prisma:migrate    # create + apply a migration (recommended for prod)
npm run prisma:studio     # open Prisma Studio GUI
```

The schema lives in `prisma/schema.prisma` (Users, Resumes, ATSReports, Jobs, Applications, ChatSessions/Messages, SavedJobs, OutreachLogs, AuditLogs).

---

## 📥 Populating Real Jobs

Jobs are fetched live on the Jobs page and also synced in bulk by a cron job.

### Manual sync (local)
The sync endpoint is protected by `CRON_SECRET`:

```bash
curl http://localhost:3000/api/cron/sync-jobs \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

This runs ~20 India-focused queries through JSearch, upserts jobs into PostgreSQL, generates embeddings, and indexes them in Pinecone.

### Automatic sync (production)
`vercel.json` schedules it every 4 hours:

```json
{ "crons": [{ "path": "/api/cron/sync-jobs", "schedule": "0 */4 * * *" }] }
```

---

## 📜 All Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at :3000 |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Run the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:push` | Push schema to the database |
| `npm run prisma:migrate` | Create & apply a migration |
| `npm run prisma:studio` | Open Prisma Studio |

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/          login, signup, verify-email, forgot/reset-password
│   ├── (onboarding)/    3-step onboarding (info → goals → resume)
│   ├── (dashboard)/     dashboard, jobs, resume, tracker, copilot, events, profile
│   ├── api/             auth, user, resume, ats, jobs, applications, copilot, events, cron
│   ├── layout.tsx       root layout + providers
│   ├── page.tsx         public marketing landing page
│   └── globals.css
├── components/          ui/, layout/, jobs/, resume/, tracker/, copilot/, dashboard/, onboarding/
├── lib/                 prisma, redis, s3, anthropic, openai, pinecone, sendgrid,
│                        firebase-admin, jobs-api, resume-parser, auth, auth-helpers,
│                        rate-limit, errors, sanitize, format, cn
├── types/               shared + next-auth type augmentation
└── middleware.ts        route protection (NextAuth)
```

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds); JWT session in httpOnly cookies.
- **Row-level scoping** on every user query (`WHERE userId = session.user.id`).
- **Rate limiting** via Redis (e.g. 100 req/min/IP on jobs, 1 OTP / 2 min / email).
- **Zod** validation on all API inputs; Prisma parameterised queries only.
- Resumes stored privately in S3 — access only via short-lived presigned URLs.
- Security-relevant events written to the `audit_logs` table.
- Email enumeration protection on register/forgot-password.

---

## ☁️ Deploying to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add **all** environment variables in Project Settings → Environment Variables.
   Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production URL.
3. Vercel runs `npm run build` (Prisma client is generated automatically).
4. The cron in `vercel.json` keeps jobs fresh. Vercel automatically sends the
   `Authorization: Bearer $CRON_SECRET` header — make sure `CRON_SECRET` is set.
5. Add your production Google OAuth redirect URI:
   `https://YOUR_DOMAIN/api/auth/callback/google`.

---

## 🧯 Graceful Degradation

The app is built so a single service outage never takes everything down:

- **Job API down** → falls back to cached jobs with a timestamped banner.
- **AI down** → ATS/Copilot show friendly messages; jobs & tracker keep working.
- **Pinecone/embeddings down** → dashboard simply hides AI matches.
- **Redis down** → rate limiting fails open.
- **SendGrid/Firebase unset** → email/push are skipped (logged), no crash.

---

## ⚠️ Notes

- The Pinecone index must use **dimension 1536** (matches `text-embedding-ada-002`).
- S3 bucket needs CORS configured to accept browser `PUT` uploads from your origin.
- If your home drive is low on space, point npm's cache elsewhere (a project `.npmrc` with `cache=D:\npm-cache` is included as an example).

---

CareerOS India — *Build something that actually gets Indian students hired.*




Running commands -


