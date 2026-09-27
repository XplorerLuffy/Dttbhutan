"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * A short fade-in on the incoming page.
 *
 * Deliberately *not* an AnimatePresence with `mode="wait"`. That waits for
 * the outgoing page's exit animation to finish before mounting the new one,
 * and in the App Router the swap only happens once the server payload has
 * arrived — so the exit plays after the wait rather than during it, and the
 * two animations land end to end on top of the server time. Half a second
 * of that on every click is what made navigation feel slow.
 *
 * With no exit animation the new page paints the moment it is ready and
 * simply fades up, which reads as fast rather than animated.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
