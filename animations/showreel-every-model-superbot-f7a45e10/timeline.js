// showreel-every-model-superbot: the engine. The whole spot is a pure function of t, like
// ../waffles-website-superbot-87a583a1/timeline.js: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock.
// It lays the SEQUENCE end to end: the scene modules (scenes/<id>.js, mounted once, rendered only while active),
// then the end slate drawn here. The black text-card machinery is kept from the engine this was forked from (no
// card is in this SEQUENCE); its shared K timing factor still reports in window.__AD.
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence (CONTRACT.txt) ----------
// showreel-every-model-superbot (forked from the previous every-model ad, itself a retheme of
// fantasy90s-every-model-superbot ?v=3) answers @shneural's post (x.com/shneural/status/2103151003272962130): the
// same motion-design showreel prompt given to Claude Opus 5.5 Max and to GPT 6 Astra Max. The hub is cropped to its
// thread, opening on the empty state, then the one-ask chat "make a 15-second motion graphics showreel. go all out."
// (scenes/tabs-assets/chat.js: Lyria 2, Meshy, Gemini, Claude Opus 5.5, DeepSeek V4 Flash, GitHub, then the same
// prompt to Claude Opus 5.5 and GPT 6 Astra, ending on the post's whole clip; every model switch is a
// motion-graphics move), then the end slate: a signal-orange bar wipe, kinetic type rising out of a baseline mask
// and a keyframe set on the spot's own timecode ruler
const SEQUENCE = [
  ['scene', 'tabs'],
  ['end', 'end'],
];
// the durations a scene gets if its module fails to load (so the spot keeps its shape): the chat runs about 25s,
// then the finale plays the whole 31.8s clip
const FALLBACK_DUR = { tabs: 58 };
const SCENE_FADE = 0.3;
const END_DUR = 4.4, DIP = 0.35;

// ---------- text cards ----------
// A part is a word string, or { img, cls, alt, after } for a brand wordmark (after = trailing punctuation),
// or { html } for styled words. The last part and the logo are kept on one line (never orphan the logo).
const B = (f) => new URL('./brand/' + f, import.meta.url).href;
const CARDS = {
  agents: { dur: 2.4, parts: ['All', { g: 'in' }, { g: 'one' }, 'app'] },
  lovable: {
    dur: 2.6, parts: ['Can', 'it', 'make', 'an', 'app', 'like', { img: B('lovable-wordmark.svg'), cls: 'wm wm-lovable', alt: 'Lovable', after: '?' }],
    logo: { src: B('lovable-logo.svg'), cls: 'lg lg-lovable', alt: '' },
  },
  cursor: {
    dur: 2.6, parts: ['But', 'can', 'it', 'code', 'like', { img: B('cursor-wordmark.svg'), cls: 'wm wm-cursor', alt: 'Cursor', after: '?' }],
    logo: { src: B('cursor-logo.svg'), cls: 'lg lg-cursor', alt: '' },
  },
  dash: {
    dur: 2.6, parts: ['I', 'just', 'want', 'a', 'burger', 'from', { img: B('doordash-wordmark.svg'), cls: 'wm wm-dash', alt: 'DoorDash' }],
    logo: { src: B('doordash-logo.svg'), cls: 'lg lg-dash', alt: '' },
  },
  cant: {
    dur: 2.6, parts: ['And', 'what', 'the', 'others', { html: '<span class="purple">can’t</span>' }],
    logo: { src: B('imp-1f608.svg'), cls: 'lg lg-imp', alt: '' },
  },
  platforms: { dur: 2.3, parts: ['It’s', 'all', 'your', 'platforms', { g: 'in' }, { g: 'one' }] },
  agents2: { dur: 2.4, parts: ['With', 'all', 'your', 'agents', { g: 'in' }, { g: 'one' }] },
  workspace: { dur: 2.9, parts: ['Your', { g: 'all' }, { g: 'in' }, { g: 'one' }, 'agent', 'workspace'] },
};
// card motion (seconds, local): words rise 18px + unblur 8px, outQuint .55s, staggered .06s
// The design timings are scaled by one factor K shared by every card, chosen so the busiest card still has
// its text fully landed and its logo fully popped READ_HOLD seconds before its exit starts (same motion on all).
const W_RISE = 18, W_BLUR = 8, CARD_OUT = 0.3, READ_HOLD = 1.2;
const BASE = { in: 0.12, stag: 0.06, dur: 0.55, gap: 0.15, logo: 0.45 };
const settleAt = (c, k) => k * (BASE.in + (c.parts.length - 1) * BASE.stag + BASE.dur + (c.logo ? BASE.gap + BASE.logo : 0));
const K = Math.min(1, ...Object.values(CARDS).map((c) => (c.dur - CARD_OUT - READ_HOLD) / settleAt(c, 1)));
const W_IN = BASE.in * K, W_STAG = BASE.stag * K, W_DUR = BASE.dur * K, LOGO_GAP = BASE.gap * K, LOGO_DUR = BASE.logo * K;

function buildCard(sec, spec) {
  sec.classList.add('card');
  const line = document.createElement('p');
  line.className = 'cl';
  const words = [], grads = [];
  const mk = (part) => {
    const w = document.createElement('span');
    w.className = 'w';
    if (typeof part === 'string') w.textContent = part;
    else if (part.g) {
      // gradient words: the gradient lives on an INNER span so the outer .w can carry the blur filter and
      // the rise without fighting background-clip:text (no filter + clip on one element)
      const gt = document.createElement('span');
      gt.className = 'gt'; gt.textContent = part.g;
      w.appendChild(gt); grads.push(gt);
    }
    else if (part.html) w.innerHTML = part.html;
    else {
      const img = document.createElement('img');
      img.className = part.cls; img.src = part.img; img.alt = part.alt || ''; img.decoding = 'sync';
      w.appendChild(img);
      if (part.after) w.appendChild(document.createTextNode(part.after));
    }
    words.push(w);
    return w;
  };
  const parts = spec.parts;
  parts.slice(0, -1).forEach((p) => { line.appendChild(mk(p)); line.appendChild(document.createTextNode(' ')); });
  const tail = document.createElement('span');
  tail.className = 'tail';
  tail.appendChild(mk(parts[parts.length - 1]));
  let logo = null;
  if (spec.logo) {
    logo = document.createElement('img');
    logo.className = spec.logo.cls; logo.src = spec.logo.src; logo.alt = spec.logo.alt; logo.decoding = 'sync';
    tail.appendChild(logo);
  }
  line.appendChild(tail);
  sec.appendChild(line);
  const land = W_IN + (words.length - 1) * W_STAG + W_DUR;
  return { line, words, logo, land, logoAt: land + LOGO_GAP, grads, gm: null };
}

function renderCard(c, lt, dur) {
  c.words.forEach((w, i) => {
    const p = outQuint(seg(lt, W_IN + i * W_STAG, W_IN + i * W_STAG + W_DUR));
    w.style.opacity = clamp(p * 1.15).toFixed(3);
    w.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * W_RISE).toFixed(2)}px)`;
    w.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * W_BLUR).toFixed(2)}px)`;
  });
  if (c.logo) {
    const f = seg(lt, c.logoAt, c.logoAt + LOGO_DUR);
    c.logo.style.opacity = outCubic(clamp(f * 2.2)).toFixed(3);
    c.logo.style.transform = `scale(${lerp(0.6, 1, outBack(f)).toFixed(4)})`;
  }
  if (c.grads.length) renderGrads(c, lt);
  const e = inOutCubic(seg(lt, dur - CARD_OUT, dur));
  c.line.style.opacity = (1 - e).toFixed(3);
  c.line.style.transform = e > 0 ? `scale(${lerp(1, 0.985, e).toFixed(4)})` : 'none';
}

// ---------- the animated brand gradient on "in one" ----------
// Two background layers clipped to the text of each .gt span, laid out in ONE coordinate space across the
// whole phrase (each word's layers are offset by its own left edge, so the colours run on across the space):
//   1. a soft white shine band, sweeping left to right once, SHINE_DUR after the words land;
//   2. the superbot storm gradient (blue -> violet -> magenta -> pink and back), a seamless tile GRAD_P px
//      wide drifting left at GRAD_V px/s. Both positions are pure functions of lt.
const GRAD_P = 900, GRAD_V = 110, SHINE_DELAY = 0.08, SHINE_DUR = 0.9;
function measureGrads(c) {
  // walk the offsetParent chain up to the line: a word mid-rise carries a transform, which makes IT the
  // offsetParent of its .gt in Chromium, so a bare offsetLeft would read 0 during the entrance
  const offX = (el) => { let x = 0; while (el && el !== c.line) { x += el.offsetLeft; el = el.offsetParent; } return x; };
  const xs = c.grads.map((g) => ({ g, x: offX(g), w: g.offsetWidth }));
  const x0 = Math.min(...xs.map((a) => a.x)), x1 = Math.max(...xs.map((a) => a.x + a.w));
  c.gm = { items: xs.map((a) => ({ g: a.g, dx: a.x - x0 })), W: Math.max(1, x1 - x0) };
}
function renderGrads(c, lt) {
  if (!c.gm) measureGrads(c);
  const { items, W } = c.gm;
  const drift = ((lt * GRAD_V) % GRAD_P + GRAD_P) % GRAD_P;
  const band = W * 0.55;
  const f = inOutCubic(seg(lt, c.land + SHINE_DELAY, c.land + SHINE_DELAY + SHINE_DUR));
  const sx = lerp(-band, W, f); // band's left edge in phrase px
  for (const { g, dx } of items) {
    g.style.backgroundSize = `${band.toFixed(1)}px 100%, ${GRAD_P}px 100%`;
    g.style.backgroundPosition = `${(sx - dx).toFixed(1)}px 0, ${(-drift - dx).toFixed(1)}px 0`;
  }
}

// the font's cap height in px at the card size, so wordmarks / logos seat on the baseline and cap line
function measureCaps() {
  const cv = document.createElement('canvas').getContext('2d');
  for (const s of SEGS) {
    if (s.kind !== 'card' || !s.card) continue;
    const cs = getComputedStyle(s.card.line);
    cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = cv.measureText('HIKMN');
    const cap = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.71;
    s.card.line.style.setProperty('--cap', cap.toFixed(2) + 'px');
    s.card.gm = null; // re-measure the gradient phrase at the new metrics
  }
}

// ---------- the end slate (the waffles-website lock-up, delivered as a motion-graphics end slate) ----------
// The lock-up (the superbot wordmark beside the live mascot) is a full-frame composition, so on a narrower frame
// it scales with the frame width: 4:3 (1440) takes 0.75 of the 16:9 mascot (220px -> 165px) and style.css holds
// the matching type and gap rules. Everything below is a pure function of the slate's local time lt (and the
// spot time t for the timecode), in the @shneural clip's own vocabulary:
//   1. WIPE: two bars stroke on and off left to right across the frame at the lock-up's height, a cobalt bar
//      leading and the signal-orange bar on top of it. Each bar's head and tail run the same cubic-bezier in-out
//      curve, the tail WIPE_LAG behind, and both carry horizontal motion blur scaled to their speed. The slate is
//      revealed behind the orange bar's tail (a clip-path mask wipe).
//   2. TYPE: "superbot" is split into glyphs inside one baseline mask; each glyph rises out of the mask on an
//      overshooting cubic-bezier, staggered, with vertical motion blur scaled to its speed.
//   3. MASCOT: pops in on the same overshoot curve once the bar's tail has passed it.
//   4. TIMECODE: a mono strip under the lock-up. The ruler is the whole spot at one tick a second; it draws on,
//      a playhead scrubs from 00:00:00:00 up to now and then rides the real clock (it reaches the ruler's end on
//      the loop's last frame), and a keyframe diamond drops onto the playhead, lands hollow, fills and pulses.
//      'Showreel 2026' is design furniture, not a claim.
//   5. Title-safe corner marks draw in from each corner.
const END_SCALE = { '4x3': 0.75 };
// cubic-bezier(x1, y1, x2, y2) as an ease, the same curve CSS and After Effects' graph editor use:
// Newton steps on x(s), with a bisection fallback; y may leave 0..1 (overshoot)
function bez(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s;
  const Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) {
      const d = X(s) - x, dd = dX(s);
      if (Math.abs(d) < 1e-7 || Math.abs(dd) < 1e-6) break;
      s -= d / dd;
    }
    if (!(s >= 0 && s <= 1) || Math.abs(X(s) - x) > 1e-5) {
      let lo = 0, hi = 1;
      s = x;
      for (let i = 0; i < 40; i++) { if (X(s) < x) lo = s; else hi = s; s = (lo + hi) / 2; }
    }
    return Y(s);
  };
}
const E_WIPE = bez(0.76, 0, 0.24, 1);   // hard in-out: the bars zip through the middle of the frame
const E_OVER = bez(0.34, 1.56, 0.64, 1); // overshoot then settle: type, mascot, playhead, diamond
const E_DRAW = bez(0.16, 1, 0.3, 1);    // a long, soft out: ruler and corner marks draw on
// slate timings (s, local)
const WIPE_DUR = 0.62, WIPE_LAG = 0.16, WIPE_LEAD = 0.045; // bar stroke, head-to-tail lag, cobalt lead over orange
const TYPE_AT = 0.34, TYPE_STAG = 0.038, TYPE_DUR = 0.62;
const FACE_AT = 0.44, FACE_DUR = 0.62;
const STRIP_AT = 0.66, SCRUB_DUR = 0.72, KEY_AT = 1.12, KEY_DROP = 0.42, RING_DUR = 0.5;
const CORNER_AT = 0.5, CORNER_DUR = 0.7;
const WORD = 'superbot';
const FRAME = 1 / 60;
// hh:mm:ss:ff at 60fps
const tcode = (s) => {
  const f = Math.max(0, Math.round(s * 60)), S = Math.floor(f / 60);
  return [Math.floor(S / 3600), Math.floor(S / 60) % 60, S % 60, f % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

function buildEnd(sec) {
  const glyphs = [...WORD].map((ch, i) => `<span class="g" style="filter:none" data-i="${i}">${ch}</span>`).join('');
  const blur = (id) => `<filter id="${id}" x="-15%" y="-60%" width="130%" height="220%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>`;
  sec.innerHTML = `
<svg class="sr-defs" width="0" height="0" aria-hidden="true">${blur('sr-mb-bar')}${[...WORD].map((_, i) => blur('sr-mb-g' + i)).join('')}</svg>
<div class="slate">
  <i class="cm cm-tl"></i><i class="cm cm-tr"></i><i class="cm cm-bl"></i><i class="cm cm-br"></i>
  <div class="slate-in">
    <div class="lock ask-end"><div class="words"><div class="gm"><h1 aria-label="${WORD}">${glyphs}</h1></div></div><div class="face"></div></div>
    <div class="tc" aria-hidden="true">
      <div class="tc-rule"><i class="tc-ticks"></i><i class="tc-key"><i class="tc-ring"></i></i><i class="tc-head"></i></div>
      <div class="tc-row"><span class="tc-l">Showreel 2026</span><span class="tc-r">00:00:00:00</span></div>
    </div>
  </div>
</div>
<div class="wipe" aria-hidden="true"><i class="wb wb-c"></i><i class="wb wb-o"></i></div>`;
  const q = (s) => sec.querySelector(s);
  const mark = shell.makeMark(Math.round(220 * (END_SCALE[(window.AR && window.AR.key)] || 1)));
  q('.face').appendChild(mark.el);
  return {
    sec, mark, geo: null,
    slate: q('.slate'), slateIn: q('.slate-in'), lock: q('.lock'), face: q('.face'),
    glyphs: [...sec.querySelectorAll('.g')],
    gBlur: [...WORD].map((_, i) => q(`#sr-mb-g${i} feGaussianBlur`)),
    barBlur: q('#sr-mb-bar feGaussianBlur'), wipe: q('.wipe'), barC: q('.wb-c'), barO: q('.wb-o'),
    rule: q('.tc-rule'), ticks: q('.tc-ticks'), head: q('.tc-head'), key: q('.tc-key'), ring: q('.tc-ring'),
    labels: [q('.tc-l'), q('.tc-r')], tcr: q('.tc-r'),
    corners: [...sec.querySelectorAll('.cm')],
  };
}

// layout the slate depends on, read once (and again after fonts load or the frame ratio changes); transforms
// never move offset* values, so this is the resting layout whatever frame is on screen
function endGeo(e) {
  if (e.geo) return e.geo;
  const top = e.slateIn.offsetTop + e.lock.offsetTop, h = e.lock.offsetHeight;
  const ruleW = e.rule.offsetWidth || 1;
  const band = h * 1.32;
  e.geo = { W: e.sec.offsetWidth || W(), bandTop: top + h / 2 - band / 2, band, ruleW, gh: e.glyphs[0] ? e.glyphs[0].offsetHeight : 128 };
  // one tick a second on the ruler (a long tick every five), so the strip is the spot's real timeline
  e.rule.style.setProperty('--sec', (ruleW / CYCLE).toFixed(3) + 'px');
  e.wipe.style.top = e.geo.bandTop.toFixed(1) + 'px';
  e.wipe.style.height = band.toFixed(1) + 'px';
  return e.geo;
}

// a bar's [tail, head] in frame px at local time lt, starting at a
function barSpan(lt, a, Wf) {
  const x0 = -60, x1 = Wf + 60;
  return [lerp(x0, x1, E_WIPE(seg(lt, a + WIPE_LAG, a + WIPE_LAG + WIPE_DUR))), lerp(x0, x1, E_WIPE(seg(lt, a, a + WIPE_DUR)))];
}
const glyphY = (lt, i) => 1 - E_OVER(seg(lt, TYPE_AT + i * TYPE_STAG, TYPE_AT + i * TYPE_STAG + TYPE_DUR));

function renderEnd(e, lt, t) {
  const g = endGeo(e), Wf = g.W;
  // 1. the wipe: cobalt leads, orange on top; the slate shows only behind the orange tail
  const [cT, cH] = barSpan(lt, 0, Wf), [oT, oH] = barSpan(lt, WIPE_LEAD, Wf);
  const place = (bar, tail, head) => {
    const w = Math.max(0, head - tail);
    bar.style.transform = `translateX(${tail.toFixed(1)}px)`;
    bar.style.width = w.toFixed(1) + 'px';
    bar.style.visibility = w > 0.5 ? 'visible' : 'hidden';
  };
  place(e.barC, cT, cH);
  place(e.barO, oT, oH);
  const [pT, pH] = barSpan(lt - FRAME, WIPE_LEAD, Wf), [pcT, pcH] = barSpan(lt - FRAME, 0, Wf);
  const speed = Math.max(Math.abs(oT - pT), Math.abs(oH - pH), Math.abs(cT - pcT), Math.abs(cH - pcH)); // px per frame
  const mb = Math.min(36, speed * 0.14);
  e.barBlur.setAttribute('stdDeviation', `${mb.toFixed(2)} 0`);
  e.wipe.style.filter = mb > 0.05 ? 'url(#sr-mb-bar)' : 'none';
  const hidden = Wf - oT;
  e.slate.style.clipPath = oT >= Wf ? 'none' : `inset(0 ${Math.min(Wf + 1, hidden).toFixed(1)}px 0 0)`;

  // 2. the type rises out of its baseline mask, one glyph at a time
  e.glyphs.forEach((el, i) => {
    const y = glyphY(lt, i), yp = glyphY(lt - FRAME, i);
    el.style.transform = Math.abs(y) < 1e-4 ? 'none' : `translateY(${(y * 108).toFixed(2)}%)`;
    const v = Math.abs(y - yp) * g.gh * 1.08; // px per frame
    const sd = Math.min(9, v * 0.32);
    e.gBlur[i].setAttribute('stdDeviation', `0 ${sd.toFixed(2)}`);
    el.style.filter = sd > 0.05 ? `url(#sr-mb-g${i})` : 'none';
  });

  // 3. the mascot pops on the overshoot, a quarter turn of wobble settling out
  const f = seg(lt, FACE_AT, FACE_AT + FACE_DUR), fe = E_OVER(f);
  lib.op(e.face, f * 4);
  e.face.style.transform = f >= 1 ? 'none' : `scale(${lerp(0.4, 1, fe).toFixed(4)}) rotate(${lerp(-14, 0, fe).toFixed(2)}deg)`;
  e.mark.render(lt);

  // 4. the timecode strip
  const d = E_DRAW(seg(lt, STRIP_AT, STRIP_AT + 0.7));
  e.ticks.style.transform = `scaleX(${d.toFixed(4)})`;
  const scrub = seg(lt, STRIP_AT + 0.06, STRIP_AT + 0.06 + SCRUB_DUR);
  const ph = clamp(lerp(0, t, E_OVER(scrub)), 0, CYCLE); // the playhead's time on the spot's timeline
  lib.op(e.head, scrub * 6);
  e.head.style.transform = `translateX(${(ph / CYCLE * g.ruleW).toFixed(2)}px)`;
  e.tcr.textContent = tcode(ph);
  e.labels.forEach((el, i) => {
    const p = E_OVER(seg(lt, STRIP_AT + 0.1 + i * 0.08, STRIP_AT + 0.62 + i * 0.08));
    el.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 110).toFixed(2)}%)`;
  });
  // the keyframe diamond: set where the playhead stands as it lands
  const land = KEY_AT + KEY_DROP;
  const kx = clamp((t - lt + land) / CYCLE, 0, 1) * g.ruleW;
  const k = seg(lt, KEY_AT, land), ke = E_OVER(k);
  lib.op(e.key, k * 5);
  e.key.style.transform = `translate(${kx.toFixed(2)}px, ${lerp(-30, 0, ke).toFixed(2)}px) rotate(${lerp(225, 45, ke).toFixed(2)}deg) scale(${lerp(0.3, 1, ke).toFixed(4)})`;
  e.key.classList.toggle('set', lt >= land);
  const r = seg(lt, land, land + RING_DUR);
  e.ring.style.opacity = r > 0 && r < 1 ? (0.9 * (1 - outCubic(r))).toFixed(3) : '0';
  e.ring.style.transform = `scale(${lerp(1, 2.8, outCubic(r)).toFixed(3)})`;

  // 5. title-safe corner marks
  const c = E_DRAW(seg(lt, CORNER_AT, CORNER_AT + CORNER_DUR));
  for (const el of e.corners) el.style.transform = `scale(${c.toFixed(4)})`;
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=13`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=22`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[showreel] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id] of SEQUENCE) {
  const dur = kind === 'card' ? CARDS[id].dur : kind === 'end' ? END_DUR : Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 8);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = kind === 'card' ? `c-${id}` : `s-${id}`;
  stage.insertBefore(sec, dip);
  SEGS.push({ kind, id, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), dur, sec });
  acc += dur;
}
const CYCLE = +acc.toFixed(4);
const T = {};
SEGS.forEach((s) => { T[s.kind === 'card' ? 'card_' + s.id : s.id] = s.t0; });
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE, cardK: K, cardSettle: Object.fromEntries(Object.entries(CARDS).map(([id, c]) => [id, +settleAt(c, K).toFixed(3)])) };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[showreel] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
}
for (const s of SEGS) {
  if (s.kind === 'card') s.card = buildCard(s.sec, CARDS[s.id]);
  else if (s.kind === 'end') s.end = buildEnd(s.sec);
  else {
    s.mod = MODS[s.id];
    if (s.mod.broken) { markBroken(s); continue; }
    try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
  }
}
measureCaps();
// the slate's ruler width follows the wordmark's real font, so its layout is read again once fonts land
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
  measureCaps();
  for (const s of SEGS) if (s.end) s.end.geo = null;
  lastT = NaN;
});

// ---------- draw one frame ----------
let active = null;
function render(t) {
  ctx.W = W(); ctx.t = t;
  let cur = SEGS[SEGS.length - 1];
  for (const s of SEGS) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  if (active !== cur) {
    if (active) { active.sec.classList.remove('on'); active.sec.style.opacity = '0'; }
    cur.sec.classList.add('on');
    active = cur;
  }
  const lt = clamp(t - cur.t0, 0, cur.dur);
  if (cur.kind === 'card') {
    cur.sec.style.opacity = '1';
    renderCard(cur.card, lt, cur.dur);
  } else if (cur.kind === 'end') {
    cur.sec.style.opacity = '1';
    renderEnd(cur.end, lt, t);
  } else {
    cur.sec.style.opacity = (seg(lt, 0, SCENE_FADE) * (1 - seg(lt, cur.dur - SCENE_FADE, cur.dur))).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
    }
  }
  // the dip at the loop: the end card goes to black over its last DIP seconds (t=0 opens on black too)
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

// ---------- fit the stage to the window (assets/ar.js sets the width) ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();
addEventListener('archange', () => {
  fit(); measureCaps(); lastT = NaN;
  for (const s of SEGS) if (s.kind === 'end') s.end = buildEnd(s.sec); // the end mascot is sized to the frame
});

// ---------- the clock (waffles-website) ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
let lastT = NaN;
function frame() {
  let t = clockNow();
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  if (t >= CYCLE) t = 0;
  render(t); lastT = t;
  requestAnimationFrame(frame);
}
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frame);
// frame-exact export/QA: pause the clock and draw t now
window.__AD.seek = (t) => { paused = true; offset = t; const c = ((t % CYCLE) + CYCLE) % CYCLE; render(c); lastT = c; };
window.__AD.ready = true;
