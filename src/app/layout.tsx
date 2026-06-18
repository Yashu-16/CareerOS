import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'CareerOS India — Get hired faster with AI',
  description:
    'AI-powered career intelligence for Indian students and early-career professionals. Real jobs, ATS resume scoring, semantic matching, and an AI career coach.',
  keywords: ['jobs India', 'career', 'ATS resume', 'AI career coach', 'internships India'],
  openGraph: {
    title: 'CareerOS India',
    description: 'Get hired faster with AI — built for the Indian job market.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1A56DB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
