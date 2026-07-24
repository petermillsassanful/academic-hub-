import type { Metadata } from 'next'
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
