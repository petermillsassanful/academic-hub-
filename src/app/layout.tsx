import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Academic Hub — Course Management Platform',
  description:
    'A professional course management platform for lecturers and students. Manage courses, assignments, and track student progress.',
  keywords: ['academic', 'courses', 'learning management', 'education'],
  openGraph: {
    title: 'Academic Hub',
    description: 'Professional course management for educators and students.',
    type: 'website',
  },
}

// viewportFit: 'cover' lets content extend under notches/home indicator so
// env(safe-area-inset-*) padding takes effect (item 2). Dark theme color
// matches the app background.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0F1E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
