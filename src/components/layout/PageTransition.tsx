'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Subtle slide/fade applied to page content on route changes (item 3).
 *
 * This is rendered from a `template.tsx`, which Next.js remounts on every
 * navigation within the segment. Because the component remounts, its mount
 * animation (initial -> animate) replays on each route change — no
 * AnimatePresence or manual keying needed.
 *
 * Kept intentionally small (8px rise, ~250ms) so it reads as native polish
 * rather than a heavy page swap. Framer Motion animates via inline styles, so
 * we honor prefers-reduced-motion through its hook (a CSS media query would
 * not touch these transforms) by collapsing to a no-op animation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
