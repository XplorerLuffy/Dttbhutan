/**
 * The video's palette and type, taken from the website rather than invented.
 *
 * `brand` and `gold` are copied out of tailwind.config.ts in the DTT Bhutan
 * repo — the same royal blue and flame-petal gold the site's header, buttons
 * and links use — so a cut from a screen capture to a title card doesn't
 * change the film's colour. `ink` is the dark ground the captures sit on,
 * which the site itself has no need for.
 *
 * The fonts are the site's too: Fraunces for display, Plus Jakarta Sans for
 * body. Both are loaded from Google Fonts in Root.tsx.
 */
export const COLORS = {
  // From the repo's tailwind.config.ts.
  brand900: "#0a3159",
  brand800: "#0a3c6b",
  brand700: "#094a86",
  brand500: "#1c72c4",
  brand300: "#82b6e6",
  brand100: "#dcebf9",
  gold400: "#f2a227",
  gold500: "#e8871a",
  gold300: "#f5b94f",
  brass300: "#d4b878",

  // The film's own stage, where the website is not on screen.
  ink: "#07090d",
  ink800: "#0d1117",
  ink700: "#161b22",
  line: "rgba(255,255,255,0.10)",
  text: "#e8eaed",
  textDim: "rgba(232,234,237,0.62)",
  textFaint: "rgba(232,234,237,0.36)",
} as const;

export const FONTS = {
  display: "'Fraunces', Georgia, serif",
  body: "'Plus Jakarta Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",

  // The same two faces with Noto Color Emoji ahead of the generic fallbacks.
  // The client's shot list puts a Bhutanese flag in the opening line, and
  // without this the render browser resolves the emoji through system-ui and
  // draws a blank box — which would be the first frame of the film.
  displayEmoji: "'Fraunces', 'Noto Color Emoji', Georgia, serif",
  bodyEmoji: "'Plus Jakarta Sans', 'Noto Color Emoji', system-ui, sans-serif",
} as const;

/** 30fps throughout — every duration in the scenes is written in seconds and
 * multiplied by this, so the story's timings read as the brief wrote them. */
export const FPS = 30;
export const seconds = (s: number) => Math.round(s * FPS);
