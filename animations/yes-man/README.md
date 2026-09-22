# superbot-yes-man

superbot.gg advertisement — "ChatGPT is a Yes Man". A chatgpt-like frontend,
deterministic and seekable, rendered live in a 16:9 frame:

1. the user pastes `mywebsite.com` (plain text — verified 1:1 on chatgpt.com:
   a link is never a chip), types **"Does my website look good?"** and hits
   enter; the bar clears like the real thing; the llm gushes *"Yes omg that
   looks great! ❤️"* — then a glazing tirade with periodic 😍✨💖 emojis that
   keeps accelerating and never stops
2. hard-cut punch cards: **LLMs are made to agree with you** (2.1s) → cut →
   **AND YOU LIKE THAT?** (0.9s)
3. the bar takes `/superbot Does my website look good?` — superbot scrapes
   aggressively across the web and audits, then: **"No.** Your business
   lacks novelty, has no monetization, and is burning $50 a month to hold
   the domain." — the camera punches in on each fragment in turn — then
   *"I recommend you aggressively take market share from a competing
   company — attack ads, framed properly: public side-by-side comparisons,
   their numbers next to yours."* and attaches **3 ad campaigns** — real
   looping clips of the family's own spots, pre-rendered to
   `assets/camp-*.webm` from the live pages (headless frames + ffmpeg)
4. the cursor glides in, about to click campaign 03 — hard cut: **WE LIKE
   WINNING** → the superbot.gg end card (the mark, then wordmark + tagline)

## Render

Any static server (`npx serve` or `python3 -m http.server`). Every frame is
computed from `t`:

- `?t=SECONDS` — freeze-frame at that second; ←/→ step ±0.25s
- `?emph=6&hold=1.0` — punch-in depth and hold (see `variants.html`)

## Record

The **Record** button plays the loop once from frame one while the tab is
captured (Screen Capture API) and downloads a 1920×1080 webm.
