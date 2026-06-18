import Link from 'next/link'
import {
  Sparkles,
  FileSearch,
  Briefcase,
  KanbanSquare,
  MessageSquare,
  Upload,
  Target,
  Send,
  ArrowRight,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-h2 font-bold">
            CareerOS<span className="text-primary-600"> India</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-body-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-primary-700 transition-all"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary-600 text-white">
        <div className="max-w-page mx-auto px-6 py-20 lg:py-28 text-center">
          <span className="inline-flex items-center gap-2 bg-primary-700/50 text-primary-100 text-body-sm px-3 py-1 rounded-full">
            <Sparkles size={14} /> Built for the Indian job market
          </span>
          <h1 className="text-display-xl lg:text-[52px] font-bold mt-6 max-w-3xl mx-auto leading-tight">
            Get hired faster with AI.
          </h1>
          <p className="text-body-lg text-primary-100 mt-4 max-w-2xl mx-auto">
            CareerOS aggregates real Indian jobs, scores your resume against ATS systems, matches you
            to roles semantically, and coaches you with an AI career advisor — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/signup"
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all inline-flex items-center gap-2"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="border border-primary-300 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-primary-700">
          <div className="max-w-page mx-auto px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              ['10,000+', 'Live Jobs'],
              ['AI-Powered', 'Job Matching'],
              ['Resume', 'ATS Scorer'],
              ['Free', 'To Start'],
            ].map(([big, small]) => (
              <div key={small}>
                <div className="text-h1 font-bold text-white">{big}</div>
                <div className="text-body-sm text-primary-100">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-page mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-display-lg">Everything you need to land the job</h2>
          <p className="text-body-lg text-gray-500 mt-3">
            One platform, purpose-built for Indian students and early-career professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[
            {
              icon: Briefcase,
              title: 'Real Indian jobs',
              desc: 'Live listings from LinkedIn, Indeed & Naukri — refreshed continuously.',
              color: 'text-primary-600 bg-primary-50',
            },
            {
              icon: FileSearch,
              title: 'ATS resume scoring',
              desc: 'AI scores your resume and suggests keyword-rich, quantified rewrites.',
              color: 'text-ai bg-ai-light',
            },
            {
              icon: Target,
              title: 'Semantic matching',
              desc: 'Get matched to roles that actually fit your skills and goals.',
              color: 'text-success bg-success-light',
            },
            {
              icon: MessageSquare,
              title: 'AI career copilot',
              desc: 'Interview prep, skill gaps and strategy — tuned for India.',
              color: 'text-warning bg-warning-light',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`h-11 w-11 rounded-lg grid place-items-center ${f.color}`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-h3 mt-4">{f.title}</h3>
              <p className="text-body-sm text-gray-500 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-page mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-display-lg">How it works</h2>
            <p className="text-body-lg text-gray-500 mt-3">Three steps to a smarter job search.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Upload, step: '1', title: 'Upload your resume', desc: 'We parse it and score it against ATS systems instantly.' },
              { icon: Target, step: '2', title: 'Get AI matches', desc: 'See roles ranked by how well they fit your profile.' },
              { icon: Send, step: '3', title: 'Apply & track', desc: 'Apply with one click and track every application on a Kanban board.' },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary-600 text-white grid place-items-center mx-auto text-h2 font-bold">
                  {s.step}
                </div>
                <s.icon size={22} className="mx-auto mt-4 text-primary-600" />
                <h3 className="text-h3 mt-3">{s.title}</h3>
                <p className="text-body-sm text-gray-500 mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-page mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-display-lg">Loved by students across India</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { name: 'Aarav Mehta', college: 'VIT Vellore', quote: 'The ATS scorer showed me exactly what was missing. I rewrote my resume and started getting callbacks within a week.' },
            { name: 'Sneha Iyer', college: 'NIT Trichy', quote: 'The AI copilot helped me prep for my product company interviews. Felt like having a mentor on demand.' },
            { name: 'Rohan Gupta', college: 'Delhi University', quote: 'Job matching is scarily accurate. I stopped scrolling random listings and focused on roles that fit.' },
          ].map((t) => (
            <div key={t.name} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <p className="text-body-md text-gray-700 prose-readable">“{t.quote}”</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-600 text-white grid place-items-center font-semibold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-body-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-caption text-gray-500">{t.college}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary-600 text-white">
        <div className="max-w-page mx-auto px-6 py-16 text-center">
          <h2 className="text-display-lg">Ready to get hired faster?</h2>
          <p className="text-body-lg text-primary-100 mt-3">
            Join thousands of Indian students taking control of their careers.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all mt-6"
          >
            Create your free account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-200">
        <div className="max-w-page mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-h2 font-bold text-white">CareerOS India</span>
            <p className="text-body-sm text-gray-500 mt-2">Get hired faster with AI.</p>
          </div>
          <FooterCol title="Product" links={['Jobs', 'Resume & ATS', 'AI Copilot', 'Tracker']} />
          <FooterCol title="Company" links={['About', 'Careers', 'Blog', 'Contact']} />
          <FooterCol title="Legal" links={['Privacy', 'Terms', 'Security']} />
        </div>
        <div className="border-t border-gray-700">
          <div className="max-w-page mx-auto px-6 py-6 text-caption text-gray-500">
            © {new Date().getFullYear()} CareerOS India. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-label text-gray-500 uppercase tracking-wide mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l}>
            <span className="text-body-sm text-gray-200 hover:text-white cursor-pointer">{l}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
