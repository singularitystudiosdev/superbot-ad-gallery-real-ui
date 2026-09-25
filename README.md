# superbot — ad gallery

Every frontend ad creative for **superbot**, in one shareable page. Click any tile to
zoom the full-size image or watch the animation play live. Static — no build, no deps.

**Live:** https://singularitystudiosdev.github.io/superbot-ad-gallery-real-ui/ (the original, unedited gallery stays at https://singularitystudiosdev.github.io/superbot-ad-gallery/)

## Contents

28 ad spots, gathered from the workspace projects and the GitHub repos:

- **14 tabs?** — the same prompt pasted into fourteen AI tabs; superbot asks every agent from one window (15s loop).
- **youtube to mp3?** — ChatGPT refuses in 166 words; the superbot popup opens the app, which fetches,
  converts and hands back a clean download link, then the pain words roll through
  refusing / slow / forgetting / lying / unorganized (25.8s loop).
- **favorite color** — the chat pitch: "whats ur favorite color".
- **is mayonnaise an instrument?** — Patrick (Band Geeks, 2001) with the ChatGPT icon on his head;
  the ChatGPT screen is asked the question and classifies mayonnaise by Hornbostel-Sachs forever, the
  camera flies down the wall; the same clip wearing the superbot icon; the superbot screen answers
  "No."; stop burning tokens; the end card (29s loop, with sound).
  `animations/mayonnaise-superbot-5c2f8e47/`, built on the who-are-you spot; the icon sits on hand
  keyframes (a cartoon head, no face detector) and the last Patrick frame is held under the tail of
  the line because the episode cuts to Squidward mid-word.
- **who are you?** — the Kazoo Kid clip with the ChatGPT icon face-tracked onto his head; the
  ChatGPT screen is asked "Who are you" and rambles about identity forever, the camera flies down
  the wall of text; the same clip wearing the superbot icon; the superbot screen (blue, pink,
  purple) answers "I'm superbot. I can do anything, test me."; stop burning tokens; the end card
  (28.5s loop, with sound). The clips are `animations/who-are-you-superbot-4a7e2c19/clip-*.mp4`,
  the icon placed per frame from an Apple Vision face track (`.tmp/whoareyou/facetrack.swift`,
  `composite.swift`).

Static image ads (`assets/ads/`):

- **stop burning tokens** · the three-word poster with the superbot icon. Rendered at every
  gallery ratio (`assets/ads/stop-burning-tokens.<ar>.png`, height 1350), so the ratio picker
  reshapes the poster the same way it reshapes the animations.
- **agents refusing? superbot can do it!** · the refusal poster (imported 1920x1080 art).
- **agents slow? superbot can do it!** · the speed poster (imported 1920x1080 art).
- **your all in one agent workspace** · the workspace poster (imported 1920x1080 art).
- **context full? / slow? / costly?** · the before/after family
  (`assets/ads/context-<pain>-poster.<ar>.png`), built from `ads-src/context-storage/`: the
  phone-cleaner "Optimize Storage" ad (a red Before bar at 250GB of 256GB, a green After bar
  at 50GB, then "you have cleaned 200GB · saved 1.2 hours") re-drawn for an agent's context
  window in the pain-poster type. Serve that folder on :8614, then
  `node ads-src/context-storage/render.mjs` from the repo root; a wide frame puts the card
  beside the headline, a tall one stacks them. The numbers per ad live in
  `ads-src/context-storage/ads.js`.

The two imported posters are flat-black art, so their other ratios are composed rather than
re-drawn: the artwork is scaled to the frame width and the frame is padded with the same black
(`ads-src/compose-imported.mjs`, native height 1080; the 16:9 file is the original bytes).

The other creative groups (hero animations, site variants, hero reveal FX, mascot toys,
images) are still defined in `gen-manifest.mjs` — re-enable by changing `ONLY_GROUP`.

## Structure

```
index.html          gallery page (grid + lightbox)
gallery.js          data fetch + grid + lightbox (vanilla, no deps)
styles.css          dark textmode theme
manifest.json       generated item list
gen-manifest.mjs    regenerates manifest.json (node gen-manifest.mjs)
animations/         each animation page, self-contained, served as-is
assets/img/         static images
assets/shots/       animation thumbnails (playwright captures)
```

New animation thumbnails: capture with playwright headless at 1280x720
(`npx playwright screenshot --viewport-size "1280,720" --wait-for-timeout 4500 <url> <out>`), pick the better-looking frame.

## Regenerating

Add a file under `assets/img/` (or a folder under `animations/`), then:

```
node gen-manifest.mjs
```

Thumbnails for new animations are playwright captures at 1280x720; reuse
`capture-230cb400.mjs` and pick the better-looking frame.

## License

MIT
