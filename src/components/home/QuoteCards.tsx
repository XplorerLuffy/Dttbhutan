import type { Testimonial } from "./TestimonialCarousel";

/**
 * Traveler quotes, three across.
 *
 * Every quote is a real Review row, and a Review can only exist against a
 * completed booking (see the schema's one-review-per-booking constraint), so
 * nothing here is written copy. Quotes are shown verbatim and untrimmed —
 * an ellipsis in a testimonial invites the suspicion that the unflattering
 * half was cut.
 */
export default function QuoteCards({ testimonials }: { testimonials: Testimonial[] }) {
  // Sized to what actually came back. An agency early on may only have one
  // reviewer, and a lone card in a three-column grid reads as a broken page
  // rather than as a young business.
  const columns =
    testimonials.length >= 3
      ? "md:grid-cols-3"
      : testimonials.length === 2
        ? "md:grid-cols-2 md:max-w-4xl"
        : "max-w-xl";

  return (
    <div className={`mx-auto grid gap-6 ${columns}`}>
      {testimonials.map((t) => (
        <figure
          key={t.id}
          className="flex flex-col rounded-2xl border border-stone-200 bg-white px-8 py-10 shadow-sm"
        >
          <span aria-hidden className="font-display text-5xl leading-none text-brand-900">
            &ldquo;
          </span>
          <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-stone-800">
            {t.comment}
          </blockquote>
          <figcaption className="mt-8">
            <p className="font-semibold text-stone-900">{t.travelerName}</p>
            <p className="mt-0.5 text-sm text-stone-500">{t.contextLabel}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
