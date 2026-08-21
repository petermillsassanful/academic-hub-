import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()
  if (!profile) redirect('/login')

  return <AppLayout profile={profile}>{children}</AppLayout>
}
