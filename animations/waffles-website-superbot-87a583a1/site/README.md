# Waffle Rank

A tiny waffle photo gallery you can actually use: pick a waffle, hand out one to
five syrup drops, and the average, the rating count and the leaderboard move
immediately. You can add your own photo and it lands on the board too. There is no
backend and no build step: plain HTML, CSS and JavaScript, and every vote lives in
`localStorage` on the visitor's own device.

## Run it

Any static server works. From this `site` directory:

    python3 -m http.server 8080
    # then open http://localhost:8080/

Opening `index.html` straight from disk also works. Some browsers hide storage on
`file://` origins, and the app detects that and keeps scores in memory for the visit
instead of failing.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole page: header, hero, syrup board, gallery, how it works, footer, and the two overlay sheets (add a waffle, waffle detail). |
| `styles.css` | Warm espresso dark theme, syrup gold accent, waffle grid backdrop, responsive down to phone widths. |
| `app.js` | Seed gallery, storage, rating maths, rendering, upload with client-side downscale, keyboard and hover handling, and the `window.WaffleRank` API. |
| `img/*.jpg` | Ten real waffle photos, 1100 pixels wide, from Wikimedia Commons. |
| `img/sources.json` | Author, license and source URL for each photo, as written by the download step. |
| `CREDITS.txt` | The same attribution in human readable form. Keep it with the images. |
| `build-steps.json` | The file order and code snippets of the build, for an animation that streams code as if the site were being generated. |
| `make-build-steps.mjs` | Regenerates `build-steps.json` by slicing real lines out of the shipped files, so a snippet can never drift from what runs. |
| `favicon.svg` | Waffle grid mark. |

## Rating model

Each seeded waffle carries the votes it already had (`base.count` and `base.sum`).
Your own score is added on top of that, so the board reads as a real community
number from the very first visit: 9 to 35 ratings per seeded waffle, 210 in total. Your score is
per device, stored under one key:

    waffleRank.v1 = {
      v: 1,
      ratings: { "<photo id>": 1..5 },
      uploads: [ { id, name, note, src, author, addedAt } ],
      sort: "top" | "rated" | "new"
    }

Tapping the score you already chose clears it, so a misclick is easy to undo. The
footer button clears every rating and upload at once (it asks for a second tap).

## Using it from another page or an iframe

Embed it as a plain iframe and it just works:

    <iframe src="/site/index.html" title="Waffle Rank" width="420" height="720"></iframe>

The page posts nothing and needs nothing. If you want to drive it from the parent
page, `window.WaffleRank` is available inside the frame:

| Member | What it does |
| --- | --- |
| `WaffleRank.version` | Storage schema version, currently `1`. |
| `WaffleRank.photos()` | `[{ id, name, author, mine, ratings, average, yourScore }]`. |
| `WaffleRank.rate(id, score)` | Same path the buttons use: stores `score` (1 to 5), updates every view, returns a boolean. Rating the value it already had clears it. |
| `WaffleRank.open(id)` | Opens the detail sheet for that waffle. |
| `WaffleRank.reset()` | Drops all ratings and uploads. |
| `WaffleRank.toast(text)` | Shows the little status pill. |
| `WaffleRank.getState()` | Deep copy of the stored state. |

Every score also emits an event on the frame document:

    document.addEventListener('wafflerank:change', (event) => {
      console.log(event.detail); // { id, score, stats: { count, sum, avg, mine } }
    });

## build-steps.json

The file is a list of build steps in the order the site would be generated, which is
the order an animation should stream them:

    {
      "app": "Waffle Rank",
      "entry": "index.html",
      "steps": [
        { "step": 1, "file": "index.html", "kind": "write", "title": "document shell",
          "startLine": 1, "endLine": 12, "chars": 310, "snippet": "<!doctype html>..." }
      ]
    }

`kind` is `write` for every step that streams a slice of a real file (with
`startLine`/`endLine` into that file) and `fetch` for the one step that downloads the
photos. Regenerate it after editing any file:

    node make-build-steps.mjs

The generator reads the needles in its `STEPS` list out of the real files and fails
loudly if a needle is missing, so the animation always streams text that exists in
the shipped code.