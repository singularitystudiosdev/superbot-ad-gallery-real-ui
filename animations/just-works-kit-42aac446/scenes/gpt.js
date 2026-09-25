// scenes/gpt.js: the ChatGPT beat that opens a spot. A 1:1 dark ChatGPT window (sidebar, the header's
// "ChatGPT" model picker, the centered thread column, the composer pill) is shown on its empty home, the
// ask is typed into the composer, the send button is pressed, the ask lands as a user bubble, ChatGPT tries
// to browse (a tool line with a spinner) and the browse FAILS (a muted "Couldn't load <host>" line, or
// cfg.gpt.fail when the ad writes its own), and then the refusal streams in word by word. The engine owns the
// section's opacity, so nothing here fades the scene itself in or out: every fade below is an inner element.
//
// render(lt) is a pure function of the scene clock: no timers, no rAF, no CSS animation, no transitions.
// Everything that moves (typed ask, caret, spinner rotation, streamed words, pointer) is computed from lt.
//
// cfg.gpt = { ask?: (defaults to cfg.ask), attempt?: 'Searching amazon.com',
//             fail?: 'amazon.com returned an error' (defaults to "Couldn't load <host>" from attempt),
//             reply: '...\n\n...' }
// dur(cfg) is laid out from the ask length and the reply length: 6.5s to 7.5s, cfg.dur.gpt overrides.
// (7.5s is the ceiling the ad series keeps so gpt + card spots stay under the ~34s loop.)
import {
  clamp, seg, op, esc, window01, typed, caret, blink, press, pressScale,
  path, placeCursor, boxIn,
} from '../lib.js';
import { makeCursor } from '../shell.js';

// The replica is drawn at the ChatGPT web layout size (1536x864) and scaled to the 1080 frame, exactly how
// assets/ar.css sizes the ChatGPT clone in the standalone spots: at 16:9 that is 1536 * 1.25 = 1920 wide, and
// on a narrower frame gpt.css follows --ar-w so the window still fills the frame edge to edge (the column
// shrinks). The 1536 / 1.25 pair lives in gpt.css: `.s-gpt .gpt-frame`.
const DEFAULT_ASK = 'Find me the best standing desk under $400 on Amazon';

// natural paces, then squeezed by the layout if the ask and the reply do not fit the duration band
const CPS = 38;   // composer typing, characters per second
const WPS = 22;   // refusal streaming, words per second
// the fixed beats (seconds). sequence: home -> typed -> press -> bubble -> tool -> failed -> refusal -> hold
const INTRO = 0.40;      // empty home on screen before the first character lands
const GAP = 0.35;        // fully typed, caret blinking, before the press
const PRESS_UP = 0.20;   // press() dips for 0.06 down, 0.06 hold, 0.14 up: the bubble posts at its release
const SEND_GAP = 0.25;   // sent, before the browse starts
const TOOL_GAP = 0.25;
const ATTEMPT = 1.20;    // the spinner is up this long before the browse fails
const FAIL_GAP = 0.35;   // the failed line is read before the refusal starts
const HOLD = 1.50;       // the finished refusal sits still this long
const DUR_MIN = 6.5, DUR_MAX = 7.5;   // the band a cfg-less spot lands in (gpt + card + hub + browser + end)

let ST = null;

/** the scene's own stylesheet, for a harness that does not link scenes/gpt.css (the kit engine does). */
function ensureCss() {
  for (const s of document.styleSheets) {
    const h = s.href || '';
    if (h && h.split('?')[0].endsWith('/scenes/gpt.css')) return;
  }
  if (document.querySelector('link[data-gpt-css]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = new URL('./gpt.css', import.meta.url).href;
  l.dataset.gptCss = '1';
  document.head.appendChild(l);
}

/** char index just past each non-space word of the refusal: the reply streams word by word, not char by char */
function wordEnds(text) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) out.push(m.index + m[0].length);
  return out;
}

/** the failed-browse line for an attempt label: 'Searching amazon.com' -> "Couldn't load amazon.com" */
function failLine(attempt) {
  const m = String(attempt).match(/[\w-]+\.(?:[\w-]+\.)*[a-z]{2,}/i);
  return m ? "Couldn't load " + m[0] : "Couldn't load that page";
}

/** cfg.gpt.fail wins when an ad writes one; otherwise the line names the host it parsed out of the attempt */
function failTextFor(spec, attempt) {
  const own = spec && spec.fail;
  if (own != null && String(own).length) return String(own);
  return attempt ? failLine(attempt) : '';
}

/**
 * The beat times, as a pure function of cfg: dur(cfg), mount() and render() all read this one layout, so
 * the scene never disagrees with the engine about how long it is. `speed` squeezes typing and streaming
 * when the written ask and reply are long (its floor keeps the refusal streaming to the very end).
 */
function layout(cfg) {
  const spec = (cfg && cfg.gpt) || {};
  const ask = String(spec.ask != null ? spec.ask : (cfg && cfg.ask) || DEFAULT_ASK);
  const reply = String(spec.reply || '');
  const ends = wordEnds(reply);
  const attempt = spec.attempt != null && String(spec.attempt).length ? String(spec.attempt) : null;

  const growth = ask.length / CPS + ends.length / WPS;                 // typing + streaming at natural pace
  const fixed = INTRO + GAP + PRESS_UP + SEND_GAP + HOLD
    + (attempt ? TOOL_GAP + ATTEMPT + FAIL_GAP : 0);
  const natural = clamp(fixed + growth, DUR_MIN, DUR_MAX);
  const ov = cfg && cfg.dur && cfg.dur.gpt;
  const dur = ov != null && isFinite(ov) && +ov > 0 ? +ov : natural;

  const room = Math.max(0.4, dur - fixed);                            // seconds the two variable beats may take
  const fit = growth > 0 ? clamp(room / growth, 0.15, 1) : 1;         // 1 = natural pace, <1 = compressed
  const speed = 1 / fit;
  const cps = CPS * speed, wps = WPS * speed;

  const type0 = INTRO;
  const type1 = type0 + ask.length / cps;
  const pressAt = type1 + GAP;
  const sendAt = pressAt + PRESS_UP;
  const toolAt = sendAt + SEND_GAP;
  const failAt = toolAt + ATTEMPT;
  const replyAt = (attempt ? failAt : toolAt) + FAIL_GAP;
  const stream1 = replyAt + ends.length / wps;

  // an explicit cfg.dur.gpt shorter than the scripted beats compresses every beat together, so the refusal
  // still finishes inside the scene instead of being cut off by the engine (which stops rendering at dur)
  const comp = stream1 > dur ? dur / stream1 : 1;
  const at = (x) => x * comp;
  const b = {
    cps: cps / comp, wps: wps / comp,
    type0: at(type0), type1: at(type1), pressAt: at(pressAt), sendAt: at(sendAt),
    toolAt: at(toolAt), failAt: at(failAt), replyAt: at(replyAt), stream1: at(stream1),
  };
  return { ask, reply, ends, attempt, dur, failText: failTextFor(spec, attempt), ...b };
}

function dur(cfg) { return layout(cfg).dur; }

// ---------- markup: the ChatGPT web replica (copied from the two refusal spots, never imported from them) --
const LOGO = '<path d="M12 2.6 20.6 7.4v9.2L12 21.4 3.4 16.6V7.4L12 2.6Zm0 2.3L5.4 8.6v6.8l6.6 3.7 6.6-3.7V8.6L12 4.9Zm0 2.6 4.3 2.4v4.2L12 16.5l-4.3-2.4V9.9L12 7.5Z"/>';
const IC = {
  panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9.5 4v16"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  image: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 10h16"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  mic: '<rect x="9" y="2.6" width="6" height="11.4" rx="3"/><path d="M5.4 10.6a6.6 6.6 0 0 0 13.2 0"/><path d="M12 17.2V21"/>',
  up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  acct: '<circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9.8" r="3.3"/><path d="M5.6 19.3a7.6 7.6 0 0 1 12.8 0"/>',
  spin: '<path d="M12 3.6a8.4 8.4 0 1 0 8.4 8.4"/>',
  broke: '<circle cx="12" cy="12" r="8.4"/><path d="M6.1 6.1 17.9 17.9"/>',
};

const svg = (inner, w, stroke = 2) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" `
  + `stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

function markup() {
  return `
<div class="gpt-frame">
  <aside class="g-side">
    <div class="g-brand">
      <svg class="g-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${LOGO}</svg>
      <span class="g-collapse">${svg(IC.panel, 18, 2)}</span>
    </div>
    <div class="g-nav on">${svg(IC.pen, 18, 2)}<span class="g-lb">New chat</span></div>
    <div class="g-nav dim">${svg(IC.search, 18, 2)}<span class="g-lb">Search chats</span></div>
    <div class="g-nav dim">${svg(IC.image, 18, 2)}<span class="g-lb">Images</span></div>
    <div class="g-flex"></div>
    <div class="g-upsell">Get responses tailored to you with memory and more.</div>
    <div class="g-login"><span class="g-acct">${svg(IC.acct, 20, 1.9)}</span><span class="g-lb">Log in</span></div>
  </aside>
  <div class="g-main">
    <header class="g-top">
      <div class="g-model">ChatGPT <span class="g-caret-d">${svg(IC.chev, 13, 2.4)}</span></div>
      <div class="g-topbtns"><span class="g-ghost">Log in</span><span class="g-solid">Sign up for free</span></div>
    </header>
    <div class="g-thread">
      <div class="g-home"><h1 class="g-hello">What can I help with?</h1></div>
      <div class="g-col">
        <div class="g-user"><span class="g-bub"></span></div>
        <div class="g-tool">
          <span class="g-spin">${svg(IC.spin, 15, 2.2)}</span>
          <span class="g-broke">${svg(IC.broke, 15, 1.8)}</span>
          <span class="g-tool-t"></span>
        </div>
        <div class="g-ai"><span class="g-tx"></span><i class="g-cursor-dot"></i></div>
      </div>
      <div class="g-scroll"><i class="g-thumb"></i></div>
    </div>
    <div class="g-foot">
      <div class="g-composer">
        <span class="g-plus">${svg(IC.plus, 20, 2)}</span>
        <span class="g-field"><span class="g-ph">Ask anything</span><span class="g-draft"></span></span>
        <span class="g-mic">${svg(IC.mic, 20, 2)}</span>
        <span class="g-send">
          <span class="g-up">${svg(IC.up, 17, 2.6)}</span>
          <span class="g-stop">${svg(IC.stop, 14, 2)}</span>
        </span>
      </div>
      <div class="g-fine">ChatGPT can make mistakes. Check important info.</div>
    </div>
  </div>
</div>`;
}

const $ = (sel, root) => root.querySelector(sel);

function mount(sec, ctx) {
  ensureCss();
  const cfg = (ctx && ctx.cfg) || {};
  const L = layout(cfg);
  const tmp = document.createElement('div');
  tmp.innerHTML = markup();
  const frame = tmp.firstElementChild;

  const r = {
    frame,
    home: $('.g-home', frame),
    col: $('.g-col', frame),
    user: $('.g-user', frame),
    bub: $('.g-bub', frame),
    tool: $('.g-tool', frame),
    spin: $('.g-spin', frame),
    toolT: $('.g-tool-t', frame),
    ai: $('.g-ai', frame),
    tx: $('.g-tx', frame),
    aiDot: $('.g-cursor-dot', frame),
    thread: $('.g-thread', frame),
    scroll: $('.g-scroll', frame),
    thumb: $('.g-thumb', frame),
    composer: $('.g-composer', frame),
    ph: $('.g-ph', frame),
    draft: $('.g-draft', frame),
    send: $('.g-send', frame),
  };
  r.bub.textContent = L.ask;
  r.toolT.textContent = L.attempt || '';

  // the pointer, in the section's coordinate space (unscaled), so its 64px footprint is not blown up by the
  // replica's 1.25 scale. Placed per frame by placeCursor().
  const cursor = makeCursor();
  sec.appendChild(cursor);
  sec.insertBefore(frame, cursor);

  ST = { sec, r, L, cfg, cursor, mw: 0, mar: '', meas: '', anchors: null };
}

/** the pointer's two anchor points, in section px (the frame's own 1.25 scale is inside them). Read when the
    pointer first renders and again on every aspect-ratio change, since a narrower frame moves the composer. */
function anchors(st) {
  const r = st.r;
  const cb = boxIn(r.composer, st.sec);
  const sb = boxIn(r.send, st.sec);
  return {
    entry: { x: cb.x + cb.w * 0.52, y: cb.y - 168 },
    send: { x: sb.cx, y: sb.cy },
  };
}

function render(lt, ctx) {
  const st = ST;
  if (!st) return;
  const t = lt;
  const L = st.L, r = st.r;
  const sent = t >= L.sendAt;

  // re-measure on an aspect-ratio change (the engine re-renders without re-mounting): the composer sits at a
  // different place on a narrower frame, so the pointer's targets move with it.
  if (!st.anchors || st.mw !== ctx.W || st.mar !== ctx.ar) { st.mw = ctx.W; st.mar = ctx.ar; st.anchors = anchors(st); }

  // ---- composer: the ask types in, the caret blinks once typing stops, the pill clears on send
  const ty = typed(L.ask, L.type0, L.cps, t);
  const draft = sent ? '' : ty.text;
  const caretOn = !sent && t >= L.type0 && (t <= L.type1 || blink(t));
  r.draft.innerHTML = esc(draft) + (caretOn ? caret(true, 'g-caret') : '');
  r.ph.style.display = draft ? 'none' : '';

  // ---- the send button: grey, lit when there is a draft, the stop square while the reply generates
  const generating = sent && t < L.stream1;
  r.send.classList.toggle('ready', !!draft && !generating);
  r.send.classList.toggle('stop', generating);
  const p = press(t, L.pressAt);
  r.send.style.transform = p ? `scale(${pressScale(t, L.pressAt, 0.12).toFixed(3)})` : '';

  // ---- the empty home hands over to the thread on send
  op(r.home, 1 - seg(t, L.sendAt - 0.15, L.sendAt + 0.20));
  op(r.user, sent ? 1 : 0);

  // ---- the browse attempt: spinner (rotation from lt) ... then the failed line, muted, with the crossed mark
  const toolOn = !!L.attempt && t >= L.toolAt;
  const failed = toolOn && t >= L.failAt;
  op(r.tool, toolOn ? 1 : 0);
  r.tool.classList.toggle('fail', failed);
  if (L.attempt) {
    r.toolT.textContent = failed ? L.failText : L.attempt;
    if (toolOn && !failed) r.spin.style.transform = `rotate(${(((t - L.toolAt) * 306) % 360).toFixed(1)}deg)`;
  }

  // ---- the refusal, word by word
  const n = t <= L.replyAt ? 0 : clamp(Math.floor((t - L.replyAt) * L.wps + 1e-6), 0, L.ends.length);
  const live = t >= L.replyAt && n < L.ends.length;
  r.tx.textContent = n ? L.reply.slice(0, L.ends[n - 1]) : '';
  op(r.ai, t >= L.replyAt ? 1 : 0);
  r.aiDot.style.display = live ? '' : 'none';
  if (live) op(r.aiDot, blink(t, 0.72) ? 1 : 0);

  // ---- the thread's scrollbar: a thumb whose height tracks how much of the thread is above the fold
  const key = `${n}|${failed}|${ctx.W}|${ctx.ar}`;
  if (st.meas !== key) {
    st.meas = key;
    const over = r.col.offsetHeight - r.thread.clientHeight;
    if (over > 2) {
      r.scroll.style.opacity = '1';
      r.thumb.style.height = Math.max(26, Math.round(r.thread.clientHeight * r.thread.clientHeight / r.col.offsetHeight)) + 'px';
    } else {
      r.scroll.style.opacity = '0';
    }
  }

  // ---- the pointer: glides in above the composer, settles on the send button while the ask types, presses
  const vis = window01(t, 0.18, L.sendAt + 0.34, 0.26, 0.30);
  const a = st.anchors;
  const pos = path(t, [
    { t: 0.18, x: a.entry.x, y: a.entry.y },
    { t: Math.max(0.5, L.pressAt - 0.40), x: a.send.x, y: a.send.y },
  ]);
  placeCursor(st.cursor, pos.x, pos.y, p, vis);
}

export default { id: 'gpt', dur, mount, render };