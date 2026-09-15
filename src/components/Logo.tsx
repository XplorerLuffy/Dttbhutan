/**
 * Droelma Tours & Travels emblem — a stylized calligraphic mark (flame
 * finial over an abstract glyph) rising from a lotus/flame petal base,
 * above a Bhutan silhouette.
 *
 * This is a hand-drawn SVG recreation, not the client's original artwork
 * file — image attachments in this session don't land on disk as a
 * readable file, so the source logo couldn't be embedded directly. Swap
 * this component's contents for the real asset (e.g. an <img> pointing at
 * a file under public/) as soon as it can be added to the repo.
 */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      role="img"
      aria-label="Droelma Tours & Travels"
    >
      {/* flame finial */}
      <path
        d="M100 8c-10 6-14 14-8 22 5 6 14 6 16-2 2 7-3 13-11 14 12 3 22-5 22-16 0-9-8-15-19-18z"
        fill="#0b5ea8"
      />
      {/* arch glyph body */}
      <path
        d="M72 46h14v46h-14a30 30 0 0 1 0-46z"
        fill="#0b5ea8"
      />
      <path
        d="M114 46c14 0 24 10 24 23 0 11-8 19-19 21 9-3 13-10 11-17-2 7-11 8-16 2-6-7-3-17 8-22-3-4-6-6-8-7z"
        fill="#0b5ea8"
      />
      <rect x="72" y="84" width="66" height="12" rx="2" fill="#0b5ea8" />
      <circle cx="105" cy="106" r="7" fill="none" stroke="#0b5ea8" strokeWidth="4" />
      {/* pedestal / vase neck */}
      <path d="M90 122h30l8 20H82z" fill="#0b5ea8" />

      {/* flame petals — gold inner, orange outer, mirrored */}
      <path
        d="M82 132c-10-4-18-2-22 6-3 6 0 12 7 12 6 0 10-6 15-18z"
        fill="#f2a227"
      />
      <path
        d="M62 138c-13-3-24 1-28 11-3 8 2 15 10 14 8-1 12-11 18-25z"
        fill="#e8871a"
      />
      <path
        d="M128 132c10-4 18-2 22 6 3 6 0 12-7 12-6 0-10-6-15-18z"
        fill="#f2a227"
      />
      <path
        d="M148 138c13-3 24 1 28 11 3 8-2 15-10 14-8-1-12-11-18-25z"
        fill="#e8871a"
      />

      {/* Bhutan silhouette */}
      <path
        d="M60 154c8-6 18-4 24 0 5-4 13-5 18-1 6-3 15-2 19 3 9-1 18 4 19 12 1 6-3 10-9 12 2 5-1 10-7 11-3 6-10 9-17 7-4 4-11 5-16 2-6 4-14 3-18-2-7 1-14-2-17-8-7 0-13-5-14-12-1-7 4-13 11-15-1-4 1-7 7-9z"
        fill="#0b5ea8"
      />
    </svg>
  );
}
