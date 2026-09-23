#!/bin/sh
# One loop of the ad at every gallery ratio -> assets/video/waffles-delivery-superbot-87a583a1.<ar>.mp4
# Serve the gallery root with HTTP Range support first (the clip must seek), then:
#   sh render-all.sh http://127.0.0.1:43322 /tmp/adwaffles-delivery/frames
set -e
BASE="$1"; TMP="$2"; HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="$HERE/../../../assets/video"
for AR in 16x9 4x3 1x1 4x5; do
  ( node "$HERE/render-ad.mjs" "$BASE/animations/waffles-delivery-superbot-87a583a1/" $AR "$TMP/$AR" \
    && ffmpeg -v error -y -framerate 30 -i "$TMP/$AR/f%04d.png" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart \
       "$OUT/waffles-delivery-superbot-87a583a1.$AR.mp4" && echo "done $AR" ) &
done
wait
