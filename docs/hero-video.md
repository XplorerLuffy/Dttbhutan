# Hero video

`public/media/hero.mp4` is the clip behind the homepage hero and the
closing banner, with `public/media/hero-poster.jpg` as its still frame.

They live under `public/media/` on purpose. `public/uploads/` is
gitignored as dev-only scratch space for local file uploads, so an asset
left there is never committed and never reaches a deployment — which is
exactly how the poster went missing the first time.

## What was wrong, and what was done

The original was **18.8 MB**: a 73-second 720p clip at ~2 Mbps, carrying an
audio track the muted hero never plays. Two consequences, and the second
was the worse one:

1. The hero showed bare gradient until enough of the clip had arrived.
2. The download competed with everything else on the connection —
   including the payload for whatever the visitor clicked next. That is
   why navigating away from the homepage felt slow.

Fixes, both in place:

- **Re-encoded to 6.2 MB** (`-crf 33`, `preset slower`, capped at 800 kbps,
  `-an` to drop the audio, `+faststart`). Compared frame by frame against
  the original at full width: slightly softer snow detail, invisible
  behind the gradient and the headline.
- **The page no longer fetches it with everything else.** `Hero.tsx` ships
  the `<video>` with `preload="none"` and *no* `src`; the poster paints the
  hero immediately, and the clip is attached only once the page has loaded
  and the browser is idle. Measured on a production build: poster
  requested at 30 ms, video at 274 ms, after load. It is skipped entirely
  under `prefers-reduced-motion`, on `saveData`, and on 2G.

## Replacing the clip

```bash
# 1. Re-encode (aim for under ~6 MB; below 3 MB is better still)
ffmpeg -i source.mp4 \
  -an -c:v libx264 -profile:v high -preset slower -crf 33 \
  -vf "scale=1280:-2:flags=lanczos" -pix_fmt yuv420p \
  -maxrate 800k -bufsize 1600k -g 48 -movflags +faststart \
  public/media/hero.mp4

# 2. Poster frame — pick a -ss on a shot that holds still well
ffmpeg -i public/media/hero.mp4 -ss 12 -frames:v 1 \
  -vf "scale=1280:-2" -q:v 6 public/media/hero-poster.jpg
```

Notes:

- `-an` drops audio; the hero is muted, so those bytes are pure waste.
- `-crf 33` is deliberately high. Check it at full width before accepting;
  lower to 30 if it looks soft, which roughly doubles the size.
- `+faststart` keeps the `moov` atom at the front so playback can begin
  before the file finishes downloading.
- The poster is what visitors see on the first frame of every cold load,
  under reduced motion, and on any device that refuses to autoplay — so
  choose it as carefully as a hero photograph.

## Budget

Under **3 MB** is the target, **6 MB** the ceiling. Above that, serve it
from Vercel Blob (already configured for photos via
`BLOB_READ_WRITE_TOKEN`) rather than from `public/`.
