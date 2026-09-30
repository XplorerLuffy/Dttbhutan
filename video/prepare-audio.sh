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

echo "voiceover.mp3 and music.mp3 rebuilt from the raw takes"
