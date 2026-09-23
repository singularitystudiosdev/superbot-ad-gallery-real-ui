#!/bin/sh
# Rebuilds assets/video/waffles-delivery-clip.mp4: a 1s first-person Denny's handoff plate + the real animated
# mascot (plain beta mark, black eye backing) riding the courier's RIGHT shoulder, i.e. the viewer's LEFT.
#   sh build-clip.sh <workdir>
# Plate: build/plate.mp4, cut from an AI-generated clip made for this ad (2026-09-23): a first frame from
#   fal-ai/nano-banana/edit with the user's Denny's bag photo as the reference, animated by
#   fal-ai/kling-video/v2.1/master/image-to-video; source seconds 1.80-2.95 (the viewer's hand closes on the handles).
set -e
W="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$W"
# 1. the plate, 1s: 25 frames at 25fps + ONE clean copy of the last frame (frame 25): the mascot layer leaves it
#    empty and index.html's live mascot takes over there. 1920x1080, no audio. 26 frames = 1.04s.
ffmpeg -v error -y -i "$HERE/plate.mp4" -filter_complex \
  "[0:v]scale=1920:-2:flags=lanczos,crop=1920:1080:0:(ih-1080)/2,fps=25,trim=end_frame=25,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop=1,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -crf 16 -preset slow "$W/base.mp4"
# 2. the mascot layer: mascot-layer.html -> 26 transparent PNGs (headless Chromium, omitBackground)
#    + handoff.json, frame 24's pose (index.html HOP_FROM must match it)
rm -rf "$W/mlayer"; node "$HERE/render-mascot.mjs" "$W/mlayer"
# 3. composite
ffmpeg -v error -y -i "$W/base.mp4" -framerate 25 -i "$W/mlayer/m%04d.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p" -c:v libx264 -crf 17 -preset slow -movflags +faststart -r 25 \
  "$HERE/../../../assets/video/waffles-delivery-clip.mp4"
ffmpeg -v error -y -i "$HERE/../../../assets/video/waffles-delivery-clip.mp4" -vf "select=eq(n\,12)" -frames:v 1 -q:v 3 "$HERE/../assets/clip-poster.jpg"
