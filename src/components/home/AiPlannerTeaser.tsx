"use client";

import { motion } from "framer-motion";

/**
 * Placeholder trip-planning prompt. Deliberately its own component: today
 * it just links to /custom-tour like the rest of the "plan a trip" entry
 * points, but it's the one spot on the homepage meant to become the real
 * AI travel planner's entry point later — swapping its contents (e.g. for
 * an inline chat input) won't require touching the rest of the homepage.
 */
export default function AiPlannerTeaser() {
  return (
    <section className="mt-20">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 px-6 py-10 text-center sm:px-12">
        <h2 className="font-display text-2xl font-semibold text-stone-900">Not sure where to start?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
          Tell us what kind of Bhutan experience you&apos;re looking for — trekking, culture, festivals,
          or a slower pace — and we&apos;ll help shape a trip around it.
        </p>
        <motion.a
          href="/custom-tour"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary mt-6 inline-block"
        >
          Plan My Trip
        </motion.a>
      </div>
    </section>
  );
}
