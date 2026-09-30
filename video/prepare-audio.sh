#!/usr/bin/env bash
# Prepares the two audio tracks from what ElevenLabs returned.
#
# Run from video/:  ./prepare-audio.sh
#
# The *-raw.mp3 files are exactly what came back and are never edited. This
# produces what the film actually plays:
#
#   voiceover.mp3  normalised to about -18 LUFS, so the narration sits at one
#                  level whatever the sentence.
#
#   music.mp3      normalised to about -23 LUFS, and its tail lifted. The score
#                  was asked to resolve and fade over its last fifteen seconds
#                  and does so by 34dB, which left the closing title in silence
#                  and read as the audio having dropped out. The lift is capped
#                  at 5.5x — enough to hold the last chord under the title, not
#                  enough to bring the track's own noise floor up with it — and
#                  a short fade at the very end is the film's own ending.
#
# It is done here rather than in the composition because Remotion compiles a
# volume function into one ffmpeg expression with a branch per distinct value,
# and an envelope this detailed builds an expression ffmpeg will not parse.
set -euo pipefail
cd "$(dirname "$0")"

ffmpeg -v error -y -i public/audio/voiceover-raw.mp3 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -b:a 192k public/audio/voiceover.mp3

ffmpeg -v error -y -i public/audio/music-raw.mp3 \
  -af "loudnorm=I=-23:TP=-2:LRA=9,\
volume='min(5.5, 1 + 4.5*max(0, t-106)/11)':eval=frame,\
afade=t=out:st=117.6:d=2.2" \
  -ar 44100 -b:a 192k public/audio/music.mp3

# ── the 72-second client story ────────────────────────────────────────────
#
# client-vo.mp3    normalised the same way as the long film's narration.
#
# client-music.mp3 normalised, and its tail lifted for the same reason. This
#                  score was asked to hold full level to the end and does not:
#                  measured in four-second windows it runs about -20 dBFS at
#                  55s, -40 at 66s and -58 at 69s, so the closing card would
#                  have played in silence. The lift ramps in from 62.5s and is
#                  capped at 10x, which holds the last chord at roughly the
#                  same level as the bed without dragging the track's own noise
#                  floor up with it. The film's own fade-out is in the Score
#                  component, not here, so there is one of it.
ffmpeg -v error -y -i public/audio/client-vo-raw.mp3 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -b:a 192k public/audio/client-vo.mp3

ffmpeg -v error -y -i public/audio/client-music-raw.mp3 \
  -af "loudnorm=I=-23:TP=-2:LRA=9,\
volume='min(10, 1 + 9*max(0, t-62.5)/6)':eval=frame" \
  -ar 44100 -b:a 192k public/audio/client-music.mp3

echo "voiceover.mp3, music.mp3, client-vo.mp3 and client-music.mp3 rebuilt from the raw takes"
