// ytx4 relay baton: the one place the stage geometry and the schedule live (stage px, seconds).
// The spot is a pure function of t; every module reads its times from here so the legs, the baton and the
// window never drift apart.

import STORY from '../yt/story-data.js';

// ---------- geometry ----------
export const STAGE = { w: 1920, h: 1080 };
// the framed window: a 1920x1080 page scaled into it, never full-bleed (margin on every side)
export const PAGE = { w: 1920, h: 1080 };
export const WIN_S = 0.735;                       // page px -> window px
export const BAR = 30;                            // the window's title bar
export const VIEW = { w: Math.round(PAGE.w * WIN_S), h: Math.round(PAGE.h * WIN_S) }; // 1411 x 794
export const WIN = { x: Math.round((STAGE.w - VIEW.w) / 2), y: 238, w: VIEW.w, h: VIEW.h + BAR };
// the rail: four chips over the window, a quarter of its width each
export const CHIP_Y = 16, CHIP_H = 60;
export const CHIP_X = [1, 3, 5, 7].map((k) => Math.round(WIN.x + (VIEW.w * k) / 8));
// the baton (task card) docks under the chip that holds it
export const CARD = { w: 480, h: 142, y: 88 };
export const dockOf = (i) => ({ x: CHIP_X[i] - CARD.w / 2, y: CARD.y, s: 1 });

// ---------- the models (the rail, left to right) ----------
export const MODELS = [
  { id: 'grok', name: 'Grok', role: 'sorts the comments', logo: 'scenes/tabs-assets/grok.png', cls: 'l-grok', c: '#e9ebf0',
    stamp: STORY.stamps.grok },
  { id: 'gemini', name: 'Gemini', role: 'watches the video', logo: 'brand/gemini-logo.svg', cls: 'l-gemini', c: '#7ea8ff',
    stamp: STORY.stamps.gemini },
  { id: 'claude', name: 'Claude Opus 5.5', role: 'writes the replies', logo: 'brand/claude-logo.svg', cls: 'l-claude', c: '#ec9a78',
    stamp: STORY.stamps.opus },
  { id: 'superbot', name: 'superbot', role: 'posts and pins', logo: 'scenes/tabs-assets/mark-clean.svg', cls: 'l-sb', c: '#b59cff',
    stamp: STORY.stamps.superbot },
];

export const ASK = STORY.ask; // every on-screen story string comes from scenes/yt/story-data.js

// ---------- the schedule (spec: 14.4 s target, 14.9 s hard cap) ----------
export const CYCLE = 14.4;
export const B = [1.4, 3.95, 7.05, 9.35, 11.9];     // open | leg 1 Grok | leg 2 Gemini | leg 3 Opus 5.5 | leg 4 superbot | end
export const SEGMENTS = [
  { kind: 'open', id: 'open', t0: 0, t1: B[0] },
  { kind: 'leg', id: 'grok', t0: B[0], t1: B[1] },
  { kind: 'leg', id: 'gemini', t0: B[1], t1: B[2] },
  { kind: 'leg', id: 'opus', t0: B[2], t1: B[3] },
  { kind: 'leg', id: 'superbot', t0: B[3], t1: B[4] },
  { kind: 'end', id: 'end', t0: B[4], t1: CYCLE },
];

// the open
export const OPEN = {
  type0: 0.0, type1: 0.62, typedAt0: 21,           // the ask is already part typed on frame 0, finishes by 0.62
  send: 0.68,                                       // the send press
  born0: 0.72, born1: 0.95,                        // the card lifts out of the composer
  fly0: 0.95, fly1: 1.55,                          // ...and flies to the Grok chip
  hubOut0: 0.92, hubOut1: 1.32,
  railIn0: 0.86, railIn1: 1.26,
  winIn0: 1.08, winIn1: 1.52,
};
// handoffs: the card leaves chip i-1 a little before the boundary and lands on chip i a little after (~0.35 s overlap)
export const HAND = [1, 2, 3].map((i) => ({ i, t0: B[i] - 0.26, t1: B[i] + 0.34 }));
// the stamp each leg presses onto the card, just before it hands the card on
export const STAMP_AT = [3.42, 6.74, 8.98, 11.5];
// the end: the card flies into the mark
export const END = { fly0: 11.86, fly1: 12.32, relayOut0: 11.90, relayOut1: 12.26, endIn0: 12.06, endIn1: 12.24, local0: 12.12, dip: 0.3 };

// ---------- leg internals ----------
export const LEG1 = { sort0: 1.58, sort1: 3.30 };
export const LEG2 = {
  scrub0: 4.18, dragOut: 0.45, dragBack: 0.30,    // the scrub (motion's scrubThenPlay): grabbed at 3:12, dragged past 9:50, eased back to 7:40
  play0: 4.93, play1: 6.33,                        // released, plays 7:40 -> 7:42 (rate 2 s / 1.4 s)
  box0: 6.33, box1: 6.70,                          // Gemini's box on the light, then its label
};
export const LEG3 = { first: 7.30, gap: 0.30, cps: 150 };  // reply k starts at first + k*gap and streams at cps
export const LEG4 = { reply0: 9.50, reply1: 10.85, pin0: 10.85, pin1: 11.45 };

// page crossfades in the window (each leg's screen)
export const XF = 0.16;
