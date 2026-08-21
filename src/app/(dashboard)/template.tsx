import { PageTransition } from '@/components/layout/PageTransition'

/**
 * A template (not a layout) so Next.js remounts it on every navigation within
 * the (dashboard) segment, letting PageTransition replay its mount animation
 * on each route change (item 3). The layout — sidebar, top bar, auth guard —
 * persists; only the page content re-animates.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <PageTransition>{children}</PageTransition>
}
