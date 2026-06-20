import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth-helpers'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) {
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      redirect('/api/auth/signout?callbackUrl=/login')
    }
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-16 flex items-center px-6 border-b border-gray-200 bg-white">
        <span className="text-h2 font-bold text-gray-900">
          CareerOS<span className="text-primary-600"> India</span>
        </span>
      </header>
      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-xl mt-8">{children}</div>
      </main>
    </div>
  )
}
