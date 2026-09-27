# Hero video

`public/uploads/herovideo.mp4` is the clip behind the homepage hero and the
closing banner.

## Why it renders late

The current file is **19.7 MB**. That is the whole problem — it is roughly
20–60× larger than a background loop needs to be, and the hero cannot show
a frame until enough of it has arrived.

Two things it is *not*:

- **Not a streaming-order problem.** The file is already "faststart": its
  `moov` atom sits before `mdat` (`ftyp`, `moov`, `moof`, `mdat`), so the
  browser can begin playback without downloading the whole file.
- **Not a caching problem.** Vercel serves `public/` from its CDN with
  long-lived caching. It is the *first* visit that hurts, and that is the
  visit that matters.

## Fixing it

Both commands need `ffmpeg` on a machine that has the file. They could not
be run in the environment this was written in: no ffmpeg, and the headless
browser there has no H.264 decoder, so a re-encode could not have been
verified even if it had been produced.

**1. Re-encode the loop** (expect roughly 1.5–3 MB):

```bash
ffmpeg -i herovideo.mp4 \
  -vf "scale=1920:-2,fps=25" \
  -c:v libx264 -profile:v high -crf 30 -preset slow \
  -pix_fmt yuv420p -an \
  -movflags +faststart \
  herovideo-web.mp4
```

- `-an` drops the audio track — the hero is muted, so those bytes are pure waste.
- `-crf 30` is deliberately high. Behind a dark overlay and moving, the
  artefacts are invisible; check it at full width before accepting. Lower to
  26 if it looks soft, which roughly doubles the size.
- `scale=1920:-2` is plenty. If the clip is 4K, this alone is most of the win.
- `+faststart` keeps the moov atom at the front.

Then replace the file:

```bash
mv herovideo-web.mp4 public/uploads/herovideo.mp4
```

**2. Extract a poster frame.** `Hero.tsx` already points at
`/uploads/hero-poster.jpg`; creating the file is all that is needed.

```bash
ffmpeg -i herovideo.mp4 -ss 00:00:01 -frames:v 1 -q:v 4 \
  public/uploads/hero-poster.jpg
```

Pick a `-ss` timestamp on a frame that looks good held still — it is what
visitors see for the first moment of every cold load, and on any device that
refuses to autoplay.

## Budget

Aim for **under 3 MB**. Above about 5 MB the late-render returns no matter
what else is tuned.

If the clip has to stay large, the alternative is to stop shipping it from
`public/` and serve it from Vercel Blob (already configured for photos via
`BLOB_READ_WRITE_TOKEN`) with an explicitly short hero cut as the poster
loop — but compressing is simpler and almost always enough.
