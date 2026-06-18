import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-primary-600 text-white p-12">
        <Link href="/" className="text-h2 font-bold">
          CareerOS<span className="text-primary-100"> India</span>
        </Link>
        <div className="max-w-md">
          <h1 className="text-display-lg">Get hired faster with AI.</h1>
          <p className="text-body-lg text-primary-100 mt-4">
            Real Indian jobs, ATS resume scoring, semantic matching, and an AI career coach — all in
            one platform built for India.
          </p>
        </div>
        <div className="flex gap-8 text-body-sm text-primary-100">
          <div>
            <div className="text-h2 font-bold text-white">10,000+</div>
            Live jobs
          </div>
          <div>
            <div className="text-h2 font-bold text-white">AI</div>
            ATS scoring
          </div>
          <div>
            <div className="text-h2 font-bold text-white">Free</div>
            To start
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
