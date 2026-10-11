#!/bin/zsh
# render the four ratios (60 fps CFR, crf 10, bt709, no rescale) via the shared prep.mjs: zsh tools/render.sh
cd /Users/adrianagne/Documents/cosmos/projects/negativity-agg/.tmp/rui-feedads.7fcf1c91
PORT=8846
ID=one-key-short-superbot-7fcf1c91
if ! curl -s -o /dev/null --max-time 2 http://127.0.0.1:$PORT/ ; then
  node .tmp/render/serve.mjs $PORT > $TMPDIR/46-serve.log 2>&1 &
  echo $! > $TMPDIR/46-serve.pid
  sleep 1
fi
for r in 4x5 16x9 4x3 1x1; do
  node .tmp/render/prep.mjs $PORT $r "[{\"id\":\"$ID\",\"folder\":\"$ID\"}]" 2>&1 | tail -3
done
echo SHORTRENDERDONE
