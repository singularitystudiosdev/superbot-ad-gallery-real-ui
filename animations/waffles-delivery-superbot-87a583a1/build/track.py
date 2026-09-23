# Cross-check for the hand keyframes in mascot-layer.html: tracks the courier's mustard beanie per frame
# (HSV mask, largest blob in the upper-left of the plate). Apple Vision body pose would have given the
# shoulder joint directly, but its model does not load in the render sandbox (ANE / CPU both returned nothing).
# usage: ffmpeg -i base.mp4 -vf scale=960:540 -q:v 3 pose/f%04d.jpg && python3 track.py pose beanie.json
import cv2, numpy as np, json, glob, sys
res = []
for f in sorted(glob.glob(sys.argv[1] + '/f*.jpg')):
    hsv = cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (17, 140, 120), (24, 215, 225))
    m[int(540 * 0.62):, :] = 0; m[:, 700:] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m)
    best = max(range(1, n), key=lambda k: st[k, cv2.CC_STAT_AREA], default=None)
    if best is None or st[best, cv2.CC_STAT_AREA] < 60: res.append(None); continue
    res.append([round(float(cen[best][0]) * 2, 1), round(float(st[best][1]) * 2, 1), int(st[best][4])])
json.dump(res, open(sys.argv[2], 'w'))
