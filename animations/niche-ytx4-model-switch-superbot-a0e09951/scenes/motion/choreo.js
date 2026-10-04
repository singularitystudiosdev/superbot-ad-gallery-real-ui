// choreo.js: the Studio Comments choreography as pure functions of progress p (0..1).
// Each returns a partial state for AD/scenes/yt/studio-comments.js update(state). The caller maps its own clock
// onto p and passes the result straight to update() (or merges extra keys of its own over it).
// Same p in, same state out: no clock, no randomness, no DOM writes.
//
//   sortState(p, studio?)  leg 1, Grok sorts the comments by sentiment                    (recommended span 2.2 s)
//   replyState(p)          leg 4, the four replies type in and post one by one, top down   (recommended span 1.5 s)
//                          (the list scrolls 220 px so the fourth composer stays in view; pinState scrolls back)
//   pinState(p)            leg 4, c1's menu, Pin, "Pinned by @noabuilds", hearts on c1+c2  (recommended span 0.9 s)
//   leg4State(p)           replyState then pinState on one 0..1 span                       (recommended span 2.4 s)
//
// `studio` (optional) is the object mountStudioComments() returned: sortState measures real row tops with its
// layout() once per order, so every row travels exactly from its old slot to its new one. Without it a 132 px row
// pitch is assumed.

import data from '../yt/story-data.js';

export const DURATIONS = { sort: 2.2, reply: 1.5, pin: 0.9, leg4: 2.4 };

// ---------------------------------------------------------------- data (from story-data.js, never retyped)
const IDS = data.comments.map((c) => c.id);
const BUCKET = Object.fromEntries(data.comments.map((c) => [c.id, data.bucketOf[c.sentiment]]));
export const INITIAL_ORDER = IDS;
export const COUNTS = { ...data.sentimentCounts };
// sorted list: Questions first (the ask is to answer comments; c1 lands on top as the top Question), then Love,
// then Critique. The spam row falls out of the list into the Spam bucket.
export const BUCKET_ORDER = ['questions', 'love', 'critique'];
export const SORTED_ORDER = BUCKET_ORDER.flatMap((b) => IDS.filter((id) => BUCKET[id] === b));
export const SPAM_IDS = IDS.filter((id) => BUCKET[id] === 'spam');
// leg 4's list (Studio, unresponded): c1 sits third so pinning visibly lifts it to the top. Spam held for review.
export const LEG4_ORDER = ['c2', 'c4', 'c1', 'c3', 'c5', 'c6', 'c7', 'c8', 'c10'];
export const PIN_ID = data.pinnedId;
export const HEARTED = [...data.heartedIds];
// replies post in on-screen order (a clean top-down cascade): c2, c4, c1, c3
export const REPLY_SEQUENCE = LEG4_ORDER.filter((id) => data.replyOrder.includes(id));

// ---------------------------------------------------------------- easing
export const clamp = (x, a = 0, b = 1) => (x <= a || !Number.isFinite(x) ? a : x >= b ? b : x);
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const outQuart = (x) => 1 - Math.pow(1 - x, 4);
export const outQuint = (x) => 1 - Math.pow(1 - x, 5);
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const inCubic = (x) => x * x * x;
/** quick out with a small overshoot that settles (rows landing in place) */
export const outBackSoft = (x) => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1000) / 1000;

// ---------------------------------------------------------------- row tops (measured once per studio + order)
const ROW_PITCH = 132;
const topsCache = new WeakMap();
function topsOf(studio, order) {
  if (!studio || typeof studio.layout !== 'function') {
    return Object.fromEntries(order.map((id, i) => [id, i * ROW_PITCH]));
  }
  let m = topsCache.get(studio);
  if (!m) { m = new Map(); topsCache.set(studio, m); }
  const key = order.join(',');
  if (!m.has(key)) m.set(key, studio.layout({ order, counts: COUNTS }).tops);
  return m.get(key);
}

// ---------------------------------------------------------------- leg 1: sort
const SORT = {
  overlayA: 0.0, overlayDur: 0.14,                         // superbot's sentiment panel and tags fade in
  countA: 0.06, countDur: 0.52, countStagger: 0.06,        // bucket counters run up, one after another
  moveA: 0.16, moveStagger: 0.028, moveDur: 0.46,          // rows lift, travel, settle (overlapping, top down)
  spamA: 0.12, spamDur: 0.42,                              // c9 drops out of the list into Spam
  filterA: 0.8,                                            // Questions chip goes active
  highlightA: 0.82, highlightDur: 0.14,                    // c1 lights up as the top Question
};

/**
 * Leg 1: Grok sorts the comments by sentiment.
 * p 0..1 -> { overlay, counts, order, rowY, filter, highlightId, highlightP, replies, hearted, pin, menuOpenId }
 * The list is laid out in the destination order from the first moment; rowY holds each row back at its old slot
 * and releases it with a staggered ease, so the rows lift (the component shadows rows in flight) and settle.
 */
export function sortState(p, studio) {
  p = clamp(p);
  const counts = {};
  Object.keys(COUNTS).forEach((k, i) => {
    const a = SORT.countA + i * SORT.countStagger;
    counts[k] = Math.round(COUNTS[k] * outQuint(seg(p, a, a + SORT.countDur)));
  });
  const spamGone = p >= SORT.spamA + SORT.spamDur;
  const order = spamGone ? [...SORTED_ORDER] : [...SORTED_ORDER, ...SPAM_IDS];
  const from = topsOf(studio, INITIAL_ORDER);
  const to = topsOf(studio, [...SORTED_ORDER, ...SPAM_IDS]);
  const rowY = {};
  SORTED_ORDER.forEach((id, i) => {
    const a = SORT.moveA + i * SORT.moveStagger;
    const u = seg(p, a, a + SORT.moveDur);
    const k = u <= 0 ? 0 : u >= 1 ? 1 : outBackSoft(inOutCubic(u) * 0.4 + outQuart(u) * 0.6);
    const d = (from[id] - to[id]) * (1 - k);
    if (Math.abs(d) > 0.05) rowY[id] = r1(d);
  });
  if (!spamGone) {
    SPAM_IDS.forEach((id) => {
      const u = seg(p, SORT.spamA, SORT.spamA + SORT.spamDur);
      // from its old slot it falls away below the list, accelerating
      rowY[id] = r1(from[id] - to[id] + inCubic(u) * 900);
    });
  }
  const hp = outCubic(seg(p, SORT.highlightA, SORT.highlightA + SORT.highlightDur));
  return {
    overlay: r3(outCubic(seg(p, SORT.overlayA, SORT.overlayA + SORT.overlayDur))),
    counts,
    order,
    rowY,
    reorder: null,
    filter: p >= SORT.filterA ? 'questions' : null,
    highlightId: hp > 0 ? 'c1' : null,
    highlightP: r3(hp),
    replies: {},
    hearted: [],
    pin: null,
    menuOpenId: null,
  };
}

// ---------------------------------------------------------------- leg 4: replies
// each reply types into the reply box, then posts (the composer folds away, the thread expands with the creator
// badge). The next reply starts typing while the previous one is still posting.
const REPLY = { a0: 0.02, stagger: 0.21, typeDur: 0.2, postDur: 0.13 };
// the list glides up while the third reply posts so the fourth composer (c3, fourth row) is fully in view, and glides
// back to the top as c1 is pinned
export const LEG4_SCROLL = 220;
const SCROLL_UP = [0.5, 0.72];

function replyAt(i, p) {
  const a = REPLY.a0 + i * REPLY.stagger;
  const tu = seg(p, a, a + REPLY.typeDur);
  // typing runs at an even pace with a soft start and finish (never a mechanical linear ramp)
  const typed = r3(tu * 0.8 + inOutCubic(tu) * 0.2);
  const posted = r3(outCubic(seg(p, a + REPLY.typeDur, a + REPLY.typeDur + REPLY.postDur)));
  return { typed, posted };
}

/**
 * Leg 4a: the four replies post one by one, top down (c2, c4, c1, c3 on screen).
 * p 0..1 -> { order, replies: { id: { typed, posted } }, hearted, pin, menuOpenId, overlay, counts, filter, ... }
 */
export function replyState(p) {
  p = clamp(p);
  const replies = {};
  REPLY_SEQUENCE.forEach((id, i) => { replies[id] = replyAt(i, p); });
  return {
    overlay: 0,
    counts: null,
    order: [...LEG4_ORDER],
    rowY: {},
    reorder: null,
    scroll: r1(LEG4_SCROLL * inOutCubic(seg(p, SCROLL_UP[0], SCROLL_UP[1]))),
    filter: null,
    highlightId: null,
    replies,
    hearted: [],
    pin: null,
    menuOpenId: null,
    menuHover: null,
  };
}

// ---------------------------------------------------------------- leg 4: pin
const PIN = {
  menuA: 0.02, menuIn: 0.14,     // c1's three-dot menu opens
  hoverA: 0.2,                   // the Pin item is chosen
  menuB: 0.38, menuOut: 0.07,    // the menu closes
  pinA: 0.36, pinDur: 0.5,       // pin.p 0..1: "Pinned by @noabuilds" grows in, then c1 travels to the top
  heart: [0.66, 0.76],           // c1 then c2 get the creator heart
};

/**
 * Leg 4b: three-dot menu opens on c1, Pin is chosen, menu closes, "Pinned by @noabuilds" appears, c1 settles at the
 * top; c1 and c2 are hearted by the creator.
 * p 0..1 -> { order, replies (all posted), menuOpenId, menuP, menuHover, pin: { id, p }, hearted, ... }
 */
export function pinState(p) {
  p = clamp(p);
  const replies = Object.fromEntries(REPLY_SEQUENCE.map((id) => [id, { typed: 1, posted: 1 }]));
  const open = p >= PIN.menuA && p < PIN.menuB;
  const menuP = open
    ? outCubic(seg(p, PIN.menuA, PIN.menuA + PIN.menuIn)) * (1 - inCubic(seg(p, PIN.menuB - PIN.menuOut, PIN.menuB)))
    : 0;
  // the component eases pin.p itself (label over 0..0.3, travel over 0.3..1); feed it a decelerating clock
  const pinP = seg(p, PIN.pinA, PIN.pinA + PIN.pinDur);
  const hearted = HEARTED.filter((id, i) => p >= PIN.heart[i]);
  return {
    overlay: 0,
    counts: null,
    order: [...LEG4_ORDER],
    rowY: {},
    reorder: null,
    scroll: r1(LEG4_SCROLL * (1 - inOutCubic(seg(p, PIN.pinA, PIN.pinA + PIN.pinDur)))),
    filter: null,
    highlightId: null,
    replies,
    menuOpenId: open ? PIN_ID : null,
    menuP: r3(menuP),
    menuHover: p >= PIN.hoverA && open ? 'pin' : null,
    pin: pinP > 0 ? { id: PIN_ID, p: r3(pinP * 0.55 + outCubic(pinP) * 0.45) } : null,
    hearted,
  };
}

/** replies then pin on one span: replies take the first `split` of it */
export function leg4State(p, split = DURATIONS.reply / (DURATIONS.reply + DURATIONS.pin)) {
  p = clamp(p);
  return p < split ? replyState(p / split) : pinState((p - split) / (1 - split));
}
