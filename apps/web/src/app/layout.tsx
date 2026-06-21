import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CareerOS — Your career, handled.',
  description:
    'CareerOS is an India-first AI career platform. Upload your profile once, and let AI tailor your resume, match you to real jobs, and track every application.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-paper text-ink-800 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
