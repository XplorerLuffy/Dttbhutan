"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/**
 * A linked card with a subtle lift + shadow on hover and a press-down on
 * tap — the kind of micro-interaction that makes a UI feel responsive
 * rather than static. No-ops (renders a plain Link) under
 * prefers-reduced-motion.
 */
export default function MotionCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 16px 28px -12px rgba(69,18,32,0.25)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}
