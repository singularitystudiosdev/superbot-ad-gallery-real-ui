#!/bin/sh
# Rebuilds assets/video/waffles-delivery-clip.mp4: a 3.04s Pexels plate + the real animated mascot (kawaii
# dressing: blush, hearts, sparkles) riding the courier's RIGHT shoulder, i.e. the viewer's LEFT.
#   sh build-clip.sh <workdir>
# Source: Pexels 7706071 "Man Opens a Door and Receives Food Delivery" by MART PRODUCTION, Pexels License
#   https://www.pexels.com/video/man-opens-a-door-and-receives-food-delivery-7706071/
set -e
W="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$W"
[ -f "$W/pex-7706071.mp4" ] || curl -sSL -o "$W/pex-7706071.mp4" "https://www.pexels.com/download/video/7706071/"
# 1. the plate, 3s: the door swings open and she is revealed (source 5.40-6.52s, 28 frames), jump cut to
#    the bag coming up and the handoff (17.60-19.48s, 47 frames), plus ONE clean copy of the last frame
#    (frame 75): the mascot layer leaves it empty and index.html's live mascot takes over there.
#    1920x1080 25fps, no audio. 76 frames = 3.04s.
ffmpeg -v error -y -i "$W/pex-7706071.mp4" -filter_complex \
  "[0:v]trim=5.40:6.52,setpts=PTS-STARTPTS[a];[0:v]trim=17.60:19.48,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[c];[c]scale=-2:1080:flags=lanczos,crop=1920:1080:40:0,fps=25,tpad=stop_mode=clone:stop=1,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -crf 16 -preset slow "$W/base.mp4"
# 2. the mascot layer: mascot-layer.html -> 76 transparent PNGs (headless Chromium, omitBackground)
#    + handoff.json, frame 74's pose (index.html HOP_FROM must match it)
rm -rf "$W/mlayer"; node "$HERE/render-mascot.mjs" "$W/mlayer"
# 3. composite
ffmpeg -v error -y -i "$W/base.mp4" -framerate 25 -i "$W/mlayer/m%04d.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p" -c:v libx264 -crf 17 -preset slow -movflags +faststart -r 25 \
  "$HERE/../../../assets/video/waffles-delivery-clip.mp4"
ffmpeg -v error -y -i "$HERE/../../../assets/video/waffles-delivery-clip.mp4" -vf "select=eq(n\,48)" -frames:v 1 -q:v 3 "$HERE/../assets/clip-poster.jpg"
