"use client";

import { motion } from "framer-motion";

/**
 * Trip-planning prompt for visitors who reached the bottom of the homepage
 * without finding a package that fits. Its own component because it's the
 * one spot on the homepage meant to become the real AI travel planner's entry
 * point later — swapping its contents (e.g. for an inline chat input) won't
 * require touching the rest of the homepage.
 *
 * Copy comes in as props rather than being read here, because this is a client
 * component and getSiteContent is server-only — the same arrangement as Hero
 * and FeatureBanner.
 */
export default function AiPlannerTeaser({
  heading,
  body,
  cta,
  ctaHref,
}: {
  heading: string;
  body: string;
  cta: string;
  ctaHref: string;
}) {
  return (
    <section className="mt-20">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 px-6 py-10 text-center sm:px-12">
        <h2 className="font-display text-2xl font-semibold text-stone-900">{heading}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600 sm:text-base">{body}</p>
        <motion.a
          href={ctaHref}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary mt-6 inline-block"
        >
          {cta}
        </motion.a>
      </div>
    </section>
  );
}
