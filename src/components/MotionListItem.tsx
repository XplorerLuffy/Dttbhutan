"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Like MotionCard, but for list items that aren't themselves a single
 * navigable link (e.g. a flight offer row with its own "Book" button
 * inside) — a hover lift with no click-through semantics.
 */
export default function MotionListItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -2, boxShadow: "0 12px 20px -10px rgba(69,18,32,0.2)" }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}
