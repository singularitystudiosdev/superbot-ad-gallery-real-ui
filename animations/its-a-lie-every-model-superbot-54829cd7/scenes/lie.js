// lie: Act 2. Pure #000, white heavy condensed caps, three cards cut hard one after another, the user's words verbatim
// (no apostrophes, the series' style):
//   ITS A LIE              (1.1s) slams in over the tweet's glitch: a 1.22 -> 1 snap, a one-frame bloom and a
//                           channel split that decays over the first frames, then a slow creep in.
//   THE SECRET IS          (1.0s) cut word by word on the beat, THE / SECRET / IS, the column creeping in.
//   ITS NOT JUST OPUS 5.5  (1.4s) ITS NOT JUST lands, then OPUS 5.5 slams under it bigger, and the last frames
//                           punch the whole card through the lens (scale up, blur, split) into the hard cut to the chat.
// render(lt) is a pure function of local time (?t=<s> freezes any frame). The type is sized in stage px (the stage is
// always 1080 high) and guarded against the stage width (ctx.W), so it reads the same at 16:9, 4:3, 1:1 and 4:5.
import { clamp, lerp, seg, outCubic, rand } from '../lib.js';

const inCubic = (x) => x * x * x;

const FRAME = 1 / 60;
const EPS = 1e-6;
const FIT_W = 0.88;   // a card's widest line never exceeds this share of the stage width
// [start, end] of each card, and its lines; each line lists its words with the time (card-local) each one cuts in
const CARDS = [
  { a: 0, b: 1.1, cls: 'lie-1', lines: [[['ITS', 0], ['A', 0], ['LIE', 0]]] },
  { a: 1.1, b: 2.1, cls: 'lie-2', lines: [[['THE', 0], ['SECRET', 0.2], ['IS', 0.45]]] },
  { a: 2.1, b: 3.5, cls: 'lie-3', lines: [[['ITS', 0], ['NOT', 0], ['JUST', 0]], [['OPUS', 0.34], ['5.5', 0.34]]] },
];
const DUR = 3.5;
const PUNCH = 0.2;    // the last card's punch-through into the cut
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Anton&display=block';

// a channel split for the type (the same technique as the tweet's glitch, tuned for white on black)
const SPLIT = `<svg class="lie-defs" width="0" height="0" aria-hidden="true"><filter id="lie-split" x="-10%" y="-20%" width="120%" height="140%" color-interpolation-filters="sRGB">
  <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
  <feOffset class="s-r" in="r" dx="0" dy="0" result="ro"/>
  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/>
  <feOffset class="s-gb" in="gb" dx="0" dy="0" result="gbo"/>
  <feBlend in="ro" in2="gbo" mode="screen"/>
</filter></svg>`;

let el = null;

function injectFont() {
  if (document.querySelector('link[data-lie-font]')) return;
  for (const [rel, href, cross] of [
    ['preconnect', 'https://fonts.googleapis.com', false],
    ['preconnect', 'https://fonts.gstatic.com', true],
    ['stylesheet', FONT_HREF, false],
  ]) {
    const l = document.createElement('link');
    l.rel = rel; l.href = href;
    if (cross) l.crossOrigin = 'anonymous';
    l.setAttribute('data-lie-font', '');
    document.head.appendChild(l);
  }
}

export default {
  id: 'lie',
  dur: DUR,

  mount(section) {
    injectFont();
    section.innerHTML = SPLIT + CARDS.map((c) => `<div class="lie-card ${c.cls}"><div class="lie-col">${c.lines.map((ln) =>
      `<div class="lie-ln">${ln.map(([w]) => `<span class="lie-w">${w}</span>`).join(' ')}</div>`).join('')}</div></div>`).join('');
    const cards = [...section.querySelectorAll('.lie-card')].map((node, i) => ({
      node, col: node.querySelector('.lie-col'), spec: CARDS[i],
      words: [...node.querySelectorAll('.lie-w')],
      at: CARDS[i].lines.flat().map(([, at]) => at),
      lines: [...node.querySelectorAll('.lie-ln')],
    }));
    el = { cards, sr: section.querySelector('.s-r'), sgb: section.querySelector('.s-gb'), split: null };
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, DUR);
    const W = (ctx && ctx.W) || (window.AR && window.AR.w) || 1920;
    let split = 0;
    el.cards.forEach((c, i) => {
      const last = i === el.cards.length - 1;
      const on = t >= c.spec.a - EPS && (t < c.spec.b - EPS || (last && t <= DUR));
      c.node.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      const u = t - c.spec.a, len = c.spec.b - c.spec.a;

      // width guard (layout widths ignore transforms, so this read is stable per W and font)
      const widest = Math.max(1, ...c.lines.map((l) => l.offsetWidth));
      const fit = Math.min(1, (W * FIT_W) / widest);

      // the card's own move: a snap in on its first word, then a steady creep; the last card punches through at the end
      const snap = outCubic(seg(u, 0, 0.14));
      let s = lerp(i === 0 ? 1.22 : 1.1, 1, snap) * lerp(1, 1.05, seg(u, 0.14, len));
      let blur = 0;
      if (last) {
        const p = inCubic(seg(u, len - PUNCH, len));
        s *= lerp(1, 2.6, p);
        blur = 14 * p;
        split = Math.max(split, 26 * p);
      }
      c.col.style.transform = `translate(-50%, -50%) scale(${(fit * s).toFixed(4)})`;
      c.col.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none';

      // words cut in on their beats: hard on, a 1.12 -> 1 settle, and a one-frame bloom
      c.words.forEach((w, j) => {
        const at = c.at[j];
        const shown = u >= at - EPS;
        w.style.visibility = shown ? 'visible' : 'hidden';
        if (!shown) return;
        const p = outCubic(seg(u, at, at + 0.12));
        const big = i === 2 && at > 0 ? 1.35 : 1.12;
        w.style.transform = p >= 1 ? 'none' : `scale(${lerp(big, 1, p).toFixed(4)})`;
        w.classList.toggle('flash', u < at + FRAME - EPS);
      });

      // the split: decays over the first 6 frames of card 1 and flickers once as OPUS 5.5 lands
      if (i === 0) split = Math.max(split, u < 6 * FRAME ? 22 * (1 - u / (6 * FRAME)) : 0);
      if (i === 2) { const o = u - 0.34; if (o >= 0 && o < 3 * FRAME) split = Math.max(split, 14); }
      if (i === 1 && u < 2 * FRAME) split = Math.max(split, 8);
    });
    const on = split > 0.05;
    if (on !== el.split) {
      el.cards.forEach((c) => { c.node.style.filter = on ? 'url(#lie-split)' : 'none'; });
      el.split = on;
    }
    if (on) {
      const k = Math.floor(t / FRAME);
      const jit = 0.75 + 0.5 * rand(k * 7 + 3);
      el.sr.setAttribute('dx', (split * jit).toFixed(1));
      el.sgb.setAttribute('dx', (-split * jit).toFixed(1));
    }
  },
};
