#!/bin/sh
# The catsurf10 variant's ten clips (scenes/tabs-assets/beats/catsurf10.a35789f3.js): the one rendered cat-surfing clip
# under a different start, crop, mirror, speed and grade per tile, the way the 10-memes grid crops and grades its one meme
# (beats/gemini.9b47fc30.js TILES). Baked to files rather than CSS so each tile's Download, and Download All, is the clip
# as the tile shows it. 320x180 covers a 5-column tile (about 104 px) at 3x; 9 s outlasts the longest a tile plays (about 8.4 s).
# Run from this folder: sh render.sh
set -e
SRC=../cat-surfing.e2265c3a.mp4
OUT_LEN=9
# n | source start s | slow-mo factor | crop zoom | crop origin x y (0..1) | mirror | grade
tile() {
  n=$1 ss=$2 sp=$3 z=$4 ox=$5 oy=$6 flip=$7 grade=$8
  crop="crop=w=iw/$z:h=ih/$z:x=(iw-iw/$z)*$ox:y=(ih-ih/$z)*$oy"
  [ "$flip" = 1 ] && crop="$crop,hflip"
  ffmpeg -v error -y -ss "$ss" -i "$SRC" -an \
    -vf "$crop,$grade,scale=320:180:flags=lanczos,setpts=$sp*PTS,fps=30" -t "$OUT_LEN" \
    -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart "cat-surfing-$n.mp4"
}
tile 1  0    1    1    .5  .5  0 "null"                                                         # as rendered
tile 2  0.6  1    1.3  .5  .55 0 "eq=saturation=1.35:contrast=1.08"                              # vivid, closer
tile 3  0.3  1    1.15 .5  .5  1 "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,eq=contrast=1.05" # sepia film, mirrored
tile 4  0.95 1    1.4  .45 .6  0 "hue=s=0,eq=contrast=1.15"                                       # black and white, tight
tile 5  0.2  1.1  1.2  .55 .4  0 "colorbalance=rs=-.12:gs=.02:bs=.18:rh=.1:bh=-.08"             # teal and orange, slowed
tile 6  0.8  1    1.1  .5  .5  1 "hue=h=-30,eq=saturation=1.1"                                   # dusk pink, mirrored
tile 7  0.5  1    1.35 .5  .5  0 "eq=brightness=.06:contrast=.9:saturation=.75:gamma=1.1"        # faded pastel
tile 8  0.1  1    1.25 .4  .55 1 "curves=preset=vintage"                                          # vintage, mirrored
tile 9  0.9  1.12 1    .5  .5  0 "eq=gamma=.85:contrast=1.2:saturation=1.2"                       # dramatic, slowed
tile 10 0.4  1    1.3  .55 .5  1 "colorbalance=rs=-.1:bs=.15:rm=-.05:bm=.1,eq=brightness=-.04"    # blue hour, mirrored
