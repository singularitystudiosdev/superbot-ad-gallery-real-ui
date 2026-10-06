// Shared grammar for the relay beats. Every model answers with its own app window, a 16:9 card (600 x 338 design px)
// that the camera pushes in on until it fills the frame, so each tool's real output is read at full size. Under the
// app sits superbot's hand-off strip: what this model was handed (IN, with the logo of the model that made it) and
// what it hands on (OUT), ending on the next model's tile. That strip is the spot's mechanic: one output feeding the
// next until YouTube Studio holds all of them.
import { seg, outCubic, streamCount, lerp } from '../../../lib.js';

export const SAY_CPS = 80;          // the model's line streams (the base's reply line)
const CARD_AT = 0.3;                // the line starts, then the window rises into the thread
const CARD_IN = 0.3;
const FOCUS_AT = 0.55;              // reply start to the push onto the window
const PUSH = 0.5;                   // the push, outQuint (tabs.js pushOf)
const BACK = 0.5;                   // the pull back to the thread
const OUT_LEAD = 0.75;              // the OUT chips land this long before the hold ends, readable while still pushed in
const CHIP_STAGGER = 0.09;

// times for a window beat whose app plays for `hold` seconds once the push has landed
export function windowTimes(r, opts, hold) {
  const T = { r, card: r + CARD_AT };
  const sw = r + FOCUS_AT;
  T.c0 = sw + 0.2;                                  // the app's own clock starts while the camera travels
  if (opts.zoom) {
    T.focus = { sw, landed: sw + PUSH, pull: sw + PUSH + hold, back: sw + PUSH + hold + BACK };
    T.end = T.focus.back;
  } else T.end = T.c0 + hold + 0.4;
  T.out = sw + PUSH + hold - OUT_LEAD;
  return T;
}

// the model's one line above its window
export function sayLine(x, text) {
  const node = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  const vis = node.firstElementChild, hid = node.lastElementChild;
  let shown = -1;
  return {
    node,
    render(t, t0) {
      const n = streamCount(text, t0 + 0.05, SAY_CPS, t);
      if (n !== shown) { vis.textContent = text.slice(0, n); hid.textContent = text.slice(n); shown = n; }
    },
  };
}

export function rise(node, t, a, dy = 14, d = CARD_IN) {
  const p = outCubic(seg(t, a, a + d));
  node.style.opacity = p.toFixed(3);
  node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
  return p;
}

export function pop(node, t, a, d = 0.22) {
  const p = outCubic(seg(t, a, a + d));
  node.style.opacity = p.toFixed(3);
  node.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.85, 1, p).toFixed(4)})`;
  return p;
}

// the window: app markup on top, the hand-off strip under it.
// ins: [{ logo, file }]  outs: [file]  next: { logo, name, cls }  (next omitted on the last hand-off)
export function windowCard(x, cls, appHtml, { ins = [], outs = [], next = null }) {
  const chip = (c, i) => `<span class="kc-chip" data-i="${i}">${c.logo ? `<img src="${c.logo}" alt=""/>` : ''}${x.esc(c.file)}</span>`;
  const card = x.el(`<div class="kc ${cls}">
    <div class="kc-app">${appHtml}</div>
    <div class="kc-io">
      ${ins.length ? `<span class="kc-lab">IN</span>${ins.map(chip).join('')}` : '<span class="kc-lab">ASK</span><span class="kc-ask">from Sam</span>'}
      <span class="kc-sp"></span>
      <span class="kc-lab kc-outl">OUT</span>${outs.map((f, i) => chip({ file: f }, `o${i}`)).join('')}
      ${next ? `<span class="kc-arrow">→</span><span class="kc-next ${next.cls || ''}"><img src="${next.logo}" alt=""/>${x.esc(next.name)}</span>` : ''}
    </div>
  </div>`);
  const outChips = [...card.querySelectorAll('.kc-chip[data-i^="o"]')];
  const tail = [card.querySelector('.kc-arrow'), card.querySelector('.kc-next')].filter(Boolean);
  const outl = card.querySelector('.kc-outl');
  return {
    card,
    app: card.firstElementChild,
    // the OUT side lands chip by chip, then the arrow and the next model
    renderIO(t, at) {
      outl.style.opacity = seg(t, at - 0.1, at + 0.1).toFixed(3);
      outChips.forEach((n, i) => pop(n, t, at + i * CHIP_STAGGER));
      tail.forEach((n) => pop(n, t, at + outChips.length * CHIP_STAGGER + 0.05));
    },
  };
}

// a value counting up between a and b
export const countUp = (t, a, b, to) => Math.round(to * outCubic(seg(t, a, b)));
export const fmt = (n) => n.toLocaleString('en-US');
