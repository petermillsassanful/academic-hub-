import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  if (profile?.role === 'admin') {
    redirect('/admin')
  } else {
    redirect('/student')
  }
}
