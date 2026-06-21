import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  { title: 'AI resume tailoring', desc: 'A version of your resume rewritten for every job, grounded in your real experience.' },
  { title: 'Real job matching', desc: 'Live postings from Greenhouse, Lever, and Ashby — filtered to India, scored against your profile.' },
  { title: 'Application tracker', desc: 'A Kanban board for every application, with interview and offer rate analytics.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="font-display text-xl font-semibold text-ink-800">CareerOS</span>
        <div className="flex gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="accent" size="sm">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-8 pt-16 text-center">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink-800 sm:text-5xl">
          Upload your profile once.
          <br />
          CareerOS handles the rest.
        </h1>
        <p className="mt-5 text-lg text-ink-500">
          An India-first AI career platform that tailors your resume, matches you to real jobs,
          and tracks every application — so you spend your time interviewing, not formatting.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/register">
              Start free <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-4xl px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-ink-100 bg-white p-5">
              <CheckCircle2 className="h-5 w-5 text-saffron-500" />
              <p className="mt-3 font-display text-base font-semibold text-ink-800">{f.title}</p>
              <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-24 px-8 py-8 text-center text-sm text-ink-300">
        CareerOS — built for the Indian job market.
      </footer>
    </div>
  );
}
