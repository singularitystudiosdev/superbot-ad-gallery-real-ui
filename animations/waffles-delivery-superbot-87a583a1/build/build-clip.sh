#!/bin/sh
# Rebuilds assets/video/waffles-delivery-clip.mp4: the Pexels plate + the real animated mascot riding the
# courier's left shoulder.  sh build-clip.sh <workdir>
# Source: Pexels 7706071 "Man Opens a Door and Receives Food Delivery" by MART PRODUCTION, Pexels License
#   https://www.pexels.com/video/man-opens-a-door-and-receives-food-delivery-7706071/
set -e
W="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$W"
[ -f "$W/pex-7706071.mp4" ] || curl -sSL -o "$W/pex-7706071.mp4" "https://www.pexels.com/download/video/7706071/"
# 1. the plate: the door opens (4.3-8.0s), jump cut to the bag and the handoff (15.6-20.3s), 1920x1080 25fps, no audio
ffmpeg -v error -y -i "$W/pex-7706071.mp4" -filter_complex \
  "[0:v]trim=4.3:8.0,setpts=PTS-STARTPTS[a];[0:v]trim=15.6:20.3,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[c];[c]scale=-2:1080:flags=lanczos,crop=1920:1080:40:0,fps=25,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -crf 16 -preset slow "$W/base.mp4"
# 2. the mascot layer: mascot-layer.html -> transparent PNGs (headless Chromium, omitBackground)
rm -rf "$W/mlayer"; node "$HERE/render-mascot.mjs" "$W/mlayer"
# 3. composite
ffmpeg -v error -y -i "$W/base.mp4" -framerate 25 -i "$W/mlayer/m%04d.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p" -c:v libx264 -crf 17 -preset slow -movflags +faststart -r 25 \
  "$HERE/../../../assets/video/waffles-delivery-clip.mp4"
ffmpeg -v error -y -i "$HERE/../../../assets/video/waffles-delivery-clip.mp4" -vf "select=eq(n\,180)" -frames:v 1 -q:v 3 "$HERE/../assets/clip-poster.jpg"
