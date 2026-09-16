"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type Testimonial = {
  id: string;
  rating: number;
  comment: string;
  travelerName: string;
  contextLabel: string;
};

export default function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  const go = (delta: number) => setIndex((i) => (i + delta + testimonials.length) % testimonials.length);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <span aria-hidden className="font-display text-4xl text-gold-400">
          &ldquo;&rdquo;
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mx-auto text-amber-500">{"★".repeat(current.rating)}{"☆".repeat(5 - current.rating)}</p>
            <p className="mt-4 font-display text-lg text-stone-800">&ldquo;{current.comment}&rdquo;</p>
            <p className="mt-4 font-semibold text-stone-900">{current.travelerName}</p>
            <p className="text-sm text-brand-700">{current.contextLabel}</p>
          </motion.div>
        </AnimatePresence>

        {testimonials.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-50"
            >
              ←
            </button>
            <div className="flex gap-1.5">
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-brand-700" : "bg-stone-300"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-50"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
